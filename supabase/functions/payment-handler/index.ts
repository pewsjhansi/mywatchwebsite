import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    let bodyData;
    try {
      bodyData = JSON.parse(rawBody);
    } catch (e) {
      bodyData = {};
    }

    const { action, order_identifier, gateway, ...params } = bodyData;

    // Helper: Check if user is admin
    const verifyAdmin = async (authHeader) => {
      if (!authHeader) throw new Error("Missing auth header");
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) throw new Error("Unauthorized");
      
      const { data: roleRow, error: roleError } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (roleError || !roleRow || roleRow.role !== 'admin') {
        throw new Error("Admin privileges required");
      }
      return user;
    };

    // Helper: Get Config
    const getConfig = async (gw) => {
      const { data, error } = await supabase.from('payment_config').select('*').eq('gateway', gw).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      return data || { enabled: false, environment: 'test', public_key: '', secret_key: '' };
    };

    // Webhook actions might not have standard internal parameters, so route them first
    if (action === 'razorpay-webhook') {
      const rzpConfig = await getConfig('razorpay');
      const razorpaySecret = rzpConfig.secret_key || Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET') || '';
      const signature = req.headers.get('x-razorpay-signature');
      
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(razorpaySecret),
        { name: "HMAC", hash: "SHA-256" },
        false, ["sign"]
      );
      const computedSignatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const computedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(computedSignatureBuffer)));

      if (computedSignature !== signature) {
        throw new Error("Invalid Razorpay Webhook Signature");
      }

      if (bodyData.event === 'payment.captured' || bodyData.event === 'order.paid') {
        const paymentEntity = bodyData.payload.payment.entity;
        const rzpOrderId = paymentEntity.order_id;
        
        // Find internal order by razorpay_order_id (assuming it was saved, or we can use notes)
        const orderIdFromNotes = paymentEntity.notes?.order_id;
        if (orderIdFromNotes) {
          await supabase.from('orders').update({
            payment_status: 'paid',
            payment_gateway: 'razorpay',
            payment_transaction_id: paymentEntity.id
          }).eq('id', orderIdFromNotes);
        }
      }
      return new Response(JSON.stringify({ status: "ok" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cashfree-webhook') {
      const signature = req.headers.get('x-webhook-signature');
      const timestamp = req.headers.get('x-webhook-timestamp');
      const cfConfig = await getConfig('cashfree');
      const cfSecret = cfConfig.secret_key || Deno.env.get('CASHFREE_SECRET_KEY') || '';

      const encoder = new TextEncoder();
      const data = encoder.encode(timestamp + rawBody);
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(cfSecret),
        { name: "HMAC", hash: "SHA-256" },
        false, ["sign"]
      );
      const computedSignatureBuffer = await crypto.subtle.sign("HMAC", key, data);
      const computedSignatureBase64 = btoa(String.fromCharCode(...new Uint8Array(computedSignatureBuffer)));

      if (computedSignatureBase64 !== signature) {
        throw new Error("Invalid Cashfree Webhook Signature");
      }

      if (bodyData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const paymentInfo = bodyData.data.payment;
        const orderInfo = bodyData.data.order;
        const internalOrderId = orderInfo.order_tags?.order_ref || orderInfo.order_id; // map back to UUID

        // Safely extract UUID if Cashfree order_id was stripped of dashes
        let matchOrder = internalOrderId;
        if (internalOrderId.length === 32) {
            matchOrder = `${internalOrderId.slice(0,8)}-${internalOrderId.slice(8,12)}-${internalOrderId.slice(12,16)}-${internalOrderId.slice(16,20)}-${internalOrderId.slice(20)}`;
        }

        await supabase.from('orders').update({
          payment_status: 'paid',
          payment_gateway: 'cashfree',
          payment_transaction_id: String(paymentInfo.cf_payment_id)
        }).or(`id.eq.${matchOrder},order_number.eq."${matchOrder}"`);
      }
      return new Response(JSON.stringify({ status: "ok" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // ACTION: CONFIGURATION (ADMIN ONLY)
    // ==========================================
    if (action === 'get-all-config') {
      // Safe config retrieval for frontend
      const { data, error } = await supabase.from('payment_config').select('gateway, enabled, environment, public_key');
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get-admin-config') {
      await verifyAdmin(req.headers.get('Authorization'));
      const { data, error } = await supabase.from('payment_config').select('*');
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'save-config') {
      await verifyAdmin(req.headers.get('Authorization'));
      const { gateway_name, enabled, environment, public_key, secret_key } = params;
      
      const payload = { gateway: gateway_name, enabled, environment, updated_at: new Date().toISOString() };
      if (public_key !== undefined) payload.public_key = public_key;
      // Only update secret if a new one is provided (it will be masked on frontend)
      if (secret_key && !secret_key.includes('••••')) {
        payload.secret_key = secret_key;
      }

      const { error } = await supabase.from('payment_config').upsert(payload);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'test-connection') {
      await verifyAdmin(req.headers.get('Authorization'));
      const { gateway_name, environment, public_key, secret_key } = params;
      
      if (gateway_name === 'razorpay') {
        const rzpAuth = btoa(`${public_key}:${secret_key}`);
        const res = await fetch('https://api.razorpay.com/v1/customers', { headers: { 'Authorization': `Basic ${rzpAuth}` } });
        if (!res.ok) throw new Error("Invalid Razorpay Credentials");
      } else if (gateway_name === 'cashfree') {
        const baseUrl = environment === 'live' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
        const res = await fetch(`${baseUrl}/orders`, { 
          method: 'GET',
          headers: { 'x-client-id': public_key, 'x-client-secret': secret_key, 'x-api-version': '2022-09-01' } 
        });
        if (res.status === 401 || res.status === 403) throw new Error("Invalid Cashfree Credentials");
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!action || !order_identifier || !gateway) {
      throw new Error("Missing required parameters for synchronous actions");
    }

    // 1. Get Order Details Securely
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${order_identifier},order_number.eq."${order_identifier}"`)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const amount = Math.round((order.grand_total || order.total_amount) * 100); // in paise/cents
    const currency = 'INR';

    // ==========================================
    // ACTION: CREATE PAYMENT ORDER
    // ==========================================
    if (action === 'create') {
      if (gateway === 'razorpay') {
        const rzpConfig = await getConfig('razorpay');
        const razorpayKey = rzpConfig.public_key || Deno.env.get('RAZORPAY_KEY_ID');
        const razorpaySecret = rzpConfig.secret_key || Deno.env.get('RAZORPAY_KEY_SECRET');

        const rzpAuth = btoa(`${razorpayKey}:${razorpaySecret}`);
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${rzpAuth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            receipt: order.id,
            notes: { order_id: order.id }
          })
        });

        const rzpData = await rzpResponse.json();
        if (rzpData.error) throw new Error(rzpData.error.description);

        return new Response(
          JSON.stringify({
            gateway_order_id: rzpData.id,
            amount: amount,
            currency: currency,
            key_id: razorpayKey
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } 
      else if (gateway === 'cashfree') {
        const cfConfig = await getConfig('cashfree');
        const cfClientId = cfConfig.public_key || Deno.env.get('CASHFREE_CLIENT_ID');
        const cfSecret = cfConfig.secret_key || Deno.env.get('CASHFREE_SECRET_KEY');
        const baseUrl = cfConfig.environment === 'live' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

        const cfResponse = await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'x-client-id': cfClientId,
            'x-client-secret': cfSecret,
            'x-api-version': '2022-09-01',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            order_id: order.id.replace(/-/g, '').substring(0,40), // CF order id max length
            order_amount: (amount / 100).toFixed(2),
            order_currency: currency,
            customer_details: {
              customer_id: order.customer_id.substring(0,40),
              customer_email: order.delivery_address?.email || 'guest@example.com',
              customer_phone: order.delivery_address?.mobile || '9999999999'
            },
            order_meta: {
              return_url: `https://your-domain.com/success.html?cf_id={order_id}&order_ref=${order.id}`,
              notify_url: `https://your-domain.com/functions/v1/payment-handler` // Configure to point to this function
            },
            order_tags: {
              order_ref: order.id
            }
          })
        });

        const cfData = await cfResponse.json();
        if (cfData.type && cfData.type === 'invalid_request_error') {
          throw new Error(cfData.message);
        }

        return new Response(
          JSON.stringify({
            gateway_session_id: cfData.payment_session_id,
            amount: amount,
            currency: currency
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } 
    
    // ==========================================
    // ACTION: VERIFY PAYMENT
    // ==========================================
    else if (action === 'verify') {
      let isVerified = false;
      let transactionId = null;

      if (gateway === 'razorpay') {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = params;
        const rzpConfig = await getConfig('razorpay');
        const razorpaySecret = rzpConfig.secret_key || Deno.env.get('RAZORPAY_KEY_SECRET') || '';

        // Verify signature
        const encoder = new TextEncoder();
        const data = encoder.encode(razorpay_order_id + "|" + razorpay_payment_id);
        const key = await crypto.subtle.importKey(
          "raw", encoder.encode(razorpaySecret),
          { name: "HMAC", hash: "SHA-256" },
          false, ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, data);
        const expectedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(signature)));

        if (expectedSignature === razorpay_signature) {
          isVerified = true;
          transactionId = razorpay_payment_id;
        }
      } 
      else if (gateway === 'cashfree') {
        const { cashfree_order_id } = params;
        const cfConfig = await getConfig('cashfree');
        const cfClientId = cfConfig.public_key || Deno.env.get('CASHFREE_CLIENT_ID');
        const cfSecret = cfConfig.secret_key || Deno.env.get('CASHFREE_SECRET_KEY');
        const baseUrl = cfConfig.environment === 'live' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

        const cfResponse = await fetch(`${baseUrl}/orders/${cashfree_order_id}/payments`, {
          method: 'GET',
          headers: {
            'x-client-id': cfClientId,
            'x-client-secret': cfSecret,
            'x-api-version': '2022-09-01',
            'Accept': 'application/json'
          }
        });
        const cfData = await cfResponse.json();
        
        // Find if any payment is SUCCESS
        const successfulPayment = Array.isArray(cfData) ? cfData.find(p => p.payment_status === 'SUCCESS') : null;
        
        if (successfulPayment) {
          isVerified = true;
          transactionId = successfulPayment.cf_payment_id;
        }
      }

      if (isVerified) {
        // Update database with success
        await supabase.from('orders').update({
          payment_status: 'paid',
          payment_gateway: gateway,
          payment_transaction_id: String(transactionId)
        }).eq('id', order.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        await supabase.from('orders').update({
          payment_status: 'failed',
          payment_gateway: gateway
        }).eq('id', order.id);
        throw new Error("Payment verification failed");
      }
    }

    throw new Error("Invalid action");

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

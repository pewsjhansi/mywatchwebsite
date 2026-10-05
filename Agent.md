# AGENTS.md

## Project: Luxury Watch Band E-Commerce Website

You are an expert full-stack developer working on a premium luxury watch band e-commerce website.

Your responsibility is to build, modify, debug, and maintain the project while preserving the existing architecture, design consistency, security, and customer shopping flow.

---

# 1. Core Project Goal

Build a premium, modern, responsive e-commerce website for luxury watch bands.

The website must provide:

* Product discovery
* Product search
* Product filtering
* Product details
* Shopping cart
* Customer registration/login
* Delivery address management
* UPI and online payment
* Secure payment verification
* Order placement
* Order history
* Admin product management
* Admin order management
* Homepage CMS

The experience should feel luxurious, clean, trustworthy, fast, and easy to use.

---

# 2. Development Principles

Always follow these rules:

1. Inspect the existing project before modifying it.
2. Reuse existing components, utilities, database structures, authentication, and styling whenever possible.
3. Do not rebuild working functionality unnecessarily.
4. Do not introduce unnecessary dependencies.
5. Keep components modular and reusable.
6. Keep business logic separate from UI logic.
7. Validate user input on both client and server where applicable.
8. Never expose secrets, API keys, payment credentials, or private database credentials in frontend code.
9. Never trust client-side payment success alone.
10. Maintain responsive behavior across desktop, tablet, and mobile.
11. Preserve existing functionality when adding new features.
12. Prefer simple, maintainable solutions over unnecessary complexity.

---

# 3. Design System

The website must have a luxury visual identity.

### Design Direction

Use:

* Minimal layout
* Premium typography
* Large high-quality product imagery
* Generous whitespace
* Elegant spacing
* Subtle borders
* Soft shadows
* Smooth but restrained animations
* Clear CTA buttons

### Suggested Visual Palette

Primary:

* Black
* White
* Warm neutral
* Champagne/gold accent

Do not overuse gold or animations.

The website should look premium rather than flashy.

---

# 4. Responsive Design

Every customer-facing page must work correctly on:

* Desktop
* Laptop
* Tablet
* Mobile

Mobile requirements:

* Responsive navigation
* Mobile search
* Mobile filter drawer
* Responsive product grid
* Touch-friendly buttons
* Responsive cart
* Responsive checkout
* Responsive forms

Never create a desktop-only feature.

---

# 5. Customer Website Structure

The main customer pages should include:

* Home
* Shop All
* Product Details
* Cart
* Login
* Registration
* Checkout
* Order Success
* Customer Account
* Order History

---

# 6. Homepage

Homepage structure:

1. Navigation/Menu
2. Search
3. Hero Carousel
4. Best Selling Products
5. Testimonials
6. New Arrivals
7. Footer

---

## Navigation

Include:

* Brand logo
* Home
* Shop All
* Men's Collection
* Women's Collection
* New Arrivals
* Best Sellers
* Search
* Account
* Cart

Cart should display the current item count.

---

# 7. Hero Carousel

The hero section must support:

* Multiple slides
* Image
* Heading
* Description
* CTA
* Navigation arrows
* Slide indicators

Hero content should come from configurable website content when CMS functionality exists.

Do not invent discounts, prices, claims, or promotional offers.

---

# 8. Product Catalog

Products must come from the database.

Never hardcode production products directly into UI components.

Product cards should support:

* Product image
* Product name
* Price
* Sale price when applicable
* Available colors
* Add to Cart
* View Details

---

# 9. Best Sellers

The homepage must display at least 8 best-selling products.

Prefer database-driven selection.

If a product is marked as a best seller in the admin system, it can appear in this section.

---

# 10. New Arrivals

New Arrivals should be database-driven.

Default sorting:

Newest products first.

Use product creation date or an explicit admin-controlled new-arrival flag.

---

# 11. Product Listing Page

The Shop page must provide:

* Product grid
* Search
* Filters
* Sorting
* Pagination or efficient loading
* Empty state

---

# 12. Product Filters

Required filters:

### Size

Filter products by available watch-band size.

### Price

Support:

* Minimum price
* Maximum price
* Optional predefined price ranges

### Color

Filter by available product colors.

### Gender

Support:

* Men
* Women
* Unisex

Filters must be combinable.

Example:

Gender + Color + Size + Price

The product results must update correctly based on all active filters.

Include:

**Clear All Filters**

---

# 13. Product Details

Every product must have a dedicated product details page.

Display:

* Product name
* Product images
* Price
* Sale price
* Description
* Material
* Size
* Color
* Gender
* Stock availability
* Quantity
* Add to Cart
* Delivery information
* Return information
* Related products

Required variants must be selected before adding the product to cart.

Unavailable variants must be disabled.

---

# 14. Shopping Cart

Cart must support:

* Product image
* Product name
* Selected size
* Selected color
* Quantity
* Unit price
* Subtotal
* Remove item
* Shipping
* Total
* Continue Shopping
* Checkout

Cart totals must update automatically.

Never allow customers to purchase more units than available inventory.

Revalidate inventory and price before final order creation.

---

# 15. Authentication

Support:

### Existing Customer

Customer can:

1. Login
2. Return to checkout
3. Continue purchasing

### New Customer

Customer can:

1. Register
2. Create account
3. Continue to checkout

Required registration information:

* Full name
* Email
* Phone
* Password

Passwords must be handled only through the secure authentication system.

Never store plain-text passwords.

---

# 16. Checkout Flow

The required customer flow is:

```text
Product
↓
Add to Cart
↓
Cart
↓
Checkout
↓
Login / Registration
↓
Payment Method
↓
Delivery Address
↓
Order Review
↓
Confirm Payment
↓
Payment Verification
↓
Order Successfully Placed
```

Do not break this flow when modifying checkout.

---

# 17. Payment

Supported payment categories:

* UPI
* Online payment

Use a properly configured payment gateway.

The frontend must never be trusted as proof of payment.

Payment status must be verified server-side using the payment provider's trusted response/webhook mechanism where applicable.

Never:

* Store card numbers
* Store CVV
* Store UPI PIN
* Expose payment secret keys
* Mark an order as paid based only on a frontend redirect

---

# 18. Delivery Address

Checkout must collect:

* Full name
* Mobile number
* Email
* House/Flat number
* Street/Locality
* City
* State
* PIN code
* Optional delivery instructions

Validate required fields before proceeding.

Allow customers to review the address before payment.

---

# 19. Order Creation

An order should contain:

* Order ID
* Customer
* Products
* Product variants
* Quantities
* Product price snapshot
* Subtotal
* Shipping
* Total
* Delivery address snapshot
* Payment status
* Order status
* Created date

Historical order information must not change simply because a product is later edited.

---

# 20. Order Status

Supported order statuses:

```text
Pending
Confirmed
Processing
Shipped
Delivered
Cancelled
```

Payment status should be managed separately.

Possible payment statuses:

```text
Pending
Paid
Failed
Refunded
```

Do not confuse payment status with fulfillment status.

---

# 21. Order Success Page

After verified successful payment, show:

* Order success message
* Order ID
* Order date
* Products
* Total amount
* Delivery address
* Payment method
* Payment status
* Delivery information
* View Orders
* Continue Shopping

Do not display success based solely on a client-side payment callback.

---

# 22. Customer Account

Customers should be able to:

* View profile
* Update profile
* Manage addresses
* View orders
* View order details
* Track order status
* View payment status
* Logout

Customers must only be able to access their own data.

---

# 23. Admin Dashboard

Create a protected admin area.

Admin sections:

* Dashboard
* Products
* Categories
* Inventory
* Orders
* Customers
* Homepage CMS
* Settings

---

# 24. Admin Dashboard Overview

Display:

* Total products
* Total orders
* Total customers
* Revenue
* Recent orders
* Low-stock products

Keep dashboard information concise and useful.

---

# 25. Admin Product Management

Admin can:

* Create product
* Edit product
* Delete/deactivate product
* Upload images
* Edit price
* Edit sale price
* Edit description
* Edit material
* Edit gender
* Manage colors
* Manage sizes
* Manage SKU
* Manage stock
* Mark product as best seller
* Mark product as new arrival
* Activate/deactivate product

Product changes must appear on the customer website automatically.

---

# 26. Admin Order Management

Admin can:

* View orders
* Search orders
* Open order details
* View customer
* View delivery address
* View products
* View payment status
* Update order status
* Add shipment/tracking information where supported

---

# 27. Admin Customer Management

Admin may view:

* Customer name
* Email
* Phone
* Registration date
* Order count
* Order history

Only authorized administrators may access this information.

---

# 28. Homepage CMS

Admin should be able to manage:

* Hero carousel
* Hero heading
* Hero description
* Hero CTA
* Banner images
* Best-selling product selection
* New-arrival selection
* Footer content

CMS changes should update the customer-facing website without requiring code changes.

---

# 29. Database Rules

Use a proper relational/data-backed architecture.

Core entities:

```text
Users
Products
Product Variants
Categories
Customers
Addresses
Orders
Order Items
Payments
Website Content
Testimonials
```

Use relationships rather than duplicated data where practical.

Use product/order snapshots where historical accuracy is required.

---

# 30. Security

Security is mandatory.

Always:

* Protect admin routes.
* Enforce authorization server-side.
* Validate input.
* Sanitize appropriate user-generated content.
* Protect customer data.
* Use secure authentication.
* Keep secrets server-side.
* Restrict database access using appropriate policies.
* Verify payment server-side.
* Prevent users from accessing another customer's orders.
* Prevent unauthorized admin access.

Never expose:

* API secret keys
* Database passwords
* Payment secret keys
* Authentication secrets

in frontend code.

---

# 31. Error Handling

Every important operation must have useful states:

* Loading
* Success
* Empty
* Error

Examples:

* Product unavailable
* Out of stock
* Invalid login
* Registration failure
* Payment failure
* Payment pending
* Checkout failure
* Network failure

Messages should be simple and understandable.

Do not expose raw database or server errors to customers.

---

# 32. Performance

Prioritize:

* Optimized images
* Lazy loading where appropriate
* Efficient database queries
* Pagination for large datasets
* Minimal unnecessary dependencies
* Minimal unnecessary API calls
* Avoid unnecessary re-renders

Do not sacrifice functionality for premature optimization.

---

# 33. Accessibility

Use:

* Semantic HTML
* Proper labels
* Keyboard navigation
* Accessible buttons
* Appropriate image alt text
* Visible focus states
* Sufficient text contrast

Forms must clearly communicate validation errors.

---

# 34. SEO

Customer-facing pages should support:

* SEO-friendly URLs
* Page titles
* Meta descriptions
* Product metadata
* Image alt text
* Sitemap
* Robots configuration
* Product structured data where appropriate

---

# 35. Code Quality

Follow these rules:

* Use clear naming.
* Keep components focused.
* Avoid duplicated code.
* Create reusable components for repeated UI.
* Keep database logic out of presentation components when practical.
* Keep payment logic isolated.
* Keep authentication logic centralized.
* Use consistent error handling.
* Remove unused code.
* Do not create unnecessary abstractions.

---

# 36. Change Management

Before implementing a feature:

1. Inspect existing code.
2. Identify related components.
3. Identify related database tables/functions.
4. Reuse existing functionality.
5. Make the smallest safe change.
6. Test affected functionality.
7. Check responsive behavior.
8. Check for regressions.

Do not rewrite large parts of the application unless necessary.

---

# 37. Testing Requirements

Before considering a feature complete, verify:

### Product

* Product displays correctly.
* Filters work.
* Search works.
* Variants work.
* Stock works.

### Cart

* Add item works.
* Quantity updates work.
* Remove works.
* Totals are correct.

### Authentication

* Registration works.
* Login works.
* Logout works.
* Protected pages are protected.

### Checkout

* Address validation works.
* Payment method selection works.
* Payment status is handled correctly.
* Duplicate order creation is prevented.

### Orders

* Successful orders are created correctly.
* Failed payments do not create falsely paid orders.
* Customers can only see their own orders.
* Admin can manage orders.

### Admin

* Unauthorized users cannot access admin.
* Product changes reflect on storefront.
* Inventory updates correctly.
* CMS changes reflect on homepage.

---

# 38. Important Business Rules

Always enforce these rules:

1. Never trust frontend price values.
2. Never trust frontend stock values.
3. Recalculate order totals on the server.
4. Revalidate inventory before creating the order.
5. Verify payment before marking an order paid.
6. Prevent duplicate payment/order processing.
7. Preserve historical order prices.
8. Customers can only access their own account/order data.
9. Only authorized admins can modify products/orders/CMS.
10. Never expose sensitive credentials.

---

# 39. UI/UX Rule

The website should feel like a luxury accessory brand.

Prioritize:

**Elegant → Simple → Fast → Trustworthy**

Do not add unnecessary:

* Popups
* Animations
* Notifications
* Complex menus
* Decorative elements
* Extra checkout steps

Every UI element should have a clear purpose.

---

# 40. Final Priority

When making implementation decisions, follow this priority:

```text
Security
↓
Correctness
↓
Payment & Order Reliability
↓
User Experience
↓
Performance
↓
Visual Polish
↓
Additional Features
```

Never sacrifice security or payment correctness for visual effects or speed of implementation.

---

# 41. Definition of Done

A feature is complete only when:

* It works with the existing architecture.
* It works on mobile and desktop.
* It has proper loading/error/empty states.
* It validates input.
* It respects authentication and authorization.
* It does not expose sensitive information.
* It does not break existing features.
* Database changes are handled correctly.
* Payment/order logic is secure where applicable.
* The UI matches the luxury design system.
* The affected flow has been tested.

Always prefer a small, reliable implementation over a large, complicated one.

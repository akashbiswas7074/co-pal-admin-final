// /home/akashbiswas7797/Desktop/vibecart/lib/database/models/index.ts

// This file's purpose is to ensure all Mongoose models are registered
// in a predictable order by importing them. This is particularly important
// in environments like Next.js with hot-reloading and serverless functions.

// Import base models first
import './user.model';
import './category.model';
import './subCategory.model';
import './tag.model';
import './vendor.model';
import './faq.model';

// Import remaining models
import './admin.model';
import './banner.model';
import './blog.model';
import './cart.model';
import './category-section.model';
import './category-size-guide.model';
import './collection-highlight.model';
import './coupon.model';
import './featured-review.model';
import './featured.video.model';
import './footer.settings.model';
import './hero-section.model';
import './home.screen.offers';
import './influencer-spotlight.model';
import './navbar-link.model';
import './navbar.links.model';
import './navbar.settings.model';
import './order.model';
import './preloader.settings.model';
import './product.model';
import './return-policy.model';
import './review.model';
import './sample-settings.model';
import './sample.model';
import './shipment.model';
import './shipping-returns.model';
import './size-guide.model';
import './stats-ticker.model';
import './topbar.model';
import './warehouse.model';
import './waybill.model';
import './website.footer.model';
import './website.logo.model';
import './website.section.model';
import './website.settings.model';
import './custom-page.model';
import './shop.model';

// Optional: Re-export models if you prefer importing them via this index file.
// e.g., export { default as User } from './user.model';
// For now, the primary goal is registration via side-effect imports.
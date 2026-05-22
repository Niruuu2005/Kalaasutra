# generate_seed.py
# Parses products.json and outputs seed.sql for Shubham Art Online Store Supabase database

import json
import uuid
import re
import os

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def escape_sql(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return 'true' if val else 'false'
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def escape_json(val):
    if val is None:
        return 'NULL'
    js_str = json.dumps(val)
    escaped = js_str.replace("'", "''")
    return f"'{escaped}'::jsonb"

def main():
    json_path = os.path.join('data', 'shubham_art', 'products.json')
    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist!")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)

    # 1. Extract Unique Categories
    categories = {}
    category_names = sorted(list(set(p.get('category', 'Paintings') for p in products)))
    
    for idx, name in enumerate(category_names):
        categories[name] = {
            'id': str(uuid.uuid4()),
            'slug': slugify(name),
            'display_order': idx + 1
        }

    sql_lines = [
        "-- seed.sql",
        "-- Auto-generated seed data for Shubham Art Online Store",
        "",
        "BEGIN;",
        "",
        "-- Clear existing data to make seeding repeatable",
        "TRUNCATE public.offer_products, public.offer_categories, public.product_variants, public.custom_options, public.product_media, public.products, public.categories, public.offers, public.site_settings, public.testimonials, public.audit_logs CASCADE;",
        "",
        "-- =========================================================================",
        "-- 1. INSERT CATEGORIES",
        "-- ========================================================================="
    ]

    for name, cat in categories.items():
        sql_lines.append(
            f"INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active) "
            f"VALUES ('{cat['id']}', {escape_sql(name)}, '{cat['slug']}', {escape_sql(f'Handcrafted {name} and personalized art pieces.')}, NULL, {cat['display_order']}, true);"
        )

    sql_lines.append("")
    sql_lines.append("-- =========================================================================")
    sql_lines.append("-- 2. INSERT PRODUCTS, MEDIA, AND OPTIONS")
    sql_lines.append("-- =========================================================================")

    for p in products:
        p_uuid = str(uuid.uuid4())
        cat_name = p.get('category', 'Paintings')
        cat_id = categories[cat_name]['id']
        
        availability = p.get('availability', 'Available')
        status = 'available'
        if availability == 'Custom Order':
            status = 'custom_order'
        elif availability == 'Sold':
            status = 'sold'
        
        is_customizable = len(p.get('customization_fields', [])) > 0
        
        # Primary material extraction
        materials = p.get('materials', [])
        material = materials[0] if materials else None
        
        # Primary color extraction
        colors = p.get('color_options', [])
        color_theme = colors[0] if colors else None
        
        title = p.get('product_name', 'Untitled Artwork')
        slug = slugify(title)
        
        # Guard against duplicate slugs by adding a random suffix or short ID if needed
        # but the source products are already consolidated, so we just use the unique slug
        desc = p.get('description', '')
        short_desc = desc[:150] + '...' if len(desc) > 150 else desc

        sql_lines.append(f"-- Product: {title}")
        sql_lines.append(
            f"INSERT INTO public.products (id, title, slug, short_description, description, category_id, base_price, currency, status, is_featured, is_customizable, estimated_delivery_days, material, color_theme, seo_title, seo_description, created_at, updated_at) "
            f"VALUES ('{p_uuid}', {escape_sql(title)}, '{slug}', {escape_sql(short_desc)}, {escape_sql(desc)}, '{cat_id}', {p['base_price']}, 'INR', '{status}', false, {escape_sql(is_customizable)}, 7, {escape_sql(material)}, {escape_sql(color_theme)}, {escape_sql(title)}, {escape_sql(short_desc)}, now(), now());"
        )
        
        # Insert product media
        media_list = p.get('gallery_images', [])
        for idx, media_file in enumerate(media_list):
            m_uuid = str(uuid.uuid4())
            is_primary = 'true' if idx == 0 else 'false'
            # We store the image filename. The UI will resolve this via public-products bucket.
            sql_lines.append(
                f"  INSERT INTO public.product_media (id, product_id, media_url, media_type, alt_text, display_order, is_primary) "
                f"  VALUES ('{m_uuid}', '{p_uuid}', {escape_sql(media_file)}, 'image', {escape_sql(f'{title} Image {idx + 1}')}, {idx}, {is_primary});"
            )
            
        # Insert customization fields as custom_options
        custom_fields = p.get('customization_fields', [])
        for idx, field in enumerate(custom_fields):
            o_uuid = str(uuid.uuid4())
            field_name = field.get('name', 'Option')
            raw_type = field.get('type', 'text')
            
            # Map input types
            input_type = 'text'
            if raw_type == 'select':
                input_type = 'dropdown'
            elif raw_type == 'color':
                input_type = 'color'
            elif raw_type == 'image':
                input_type = 'image_upload'
                
            required = 'true' if field.get('required', False) else 'false'
            options_arr = field.get('options', None)
            
            sql_lines.append(
                f"  INSERT INTO public.custom_options (id, product_id, label, input_type, required, options, display_order, is_active) "
                f"  VALUES ('{o_uuid}', '{p_uuid}', {escape_sql(field_name)}, '{input_type}', {required}, {escape_json(options_arr)}, {idx}, true);"
            )

        # Seed default size & frame variants for sketch/portrait products to demonstrate variants functionality
        title_lower = title.lower()
        if 'sketch' in title_lower or 'portrait' in title_lower or 'painting' in title_lower or 'drawing' in title_lower:
            # Sizes
            sizes = [
                ('Size', 'A4 (Standard)', 0.00),
                ('Size', 'A3 (Medium)', 500.00),
                ('Size', 'A2 (Large)', 1200.00)
            ]
            for name, opt, adj in sizes:
                v_uuid = str(uuid.uuid4())
                sql_lines.append(
                    f"  INSERT INTO public.product_variants (id, product_id, name, option_name, price_adjustment, is_active) "
                    f"  VALUES ('{v_uuid}', '{p_uuid}', '{name}', '{opt}', {adj}, true);"
                )
            # Framing options
            frames = [
                ('Frame', 'Unframed (Roll / Digital)', 0.00),
                ('Frame', 'Black Classic Frame', 250.00),
                ('Frame', 'Warm Wooden Frame', 300.00)
            ]
            for name, opt, adj in frames:
                v_uuid = str(uuid.uuid4())
                sql_lines.append(
                    f"  INSERT INTO public.product_variants (id, product_id, name, option_name, price_adjustment, is_active) "
                    f"  VALUES ('{v_uuid}', '{p_uuid}', '{name}', '{opt}', {adj}, true);"
                )

        sql_lines.append("")

    # Mark the first 3 products as featured
    sql_lines.append("-- Mark featured products")
    sql_lines.append("UPDATE public.products SET is_featured = true WHERE id IN (SELECT id FROM public.products ORDER BY created_at DESC LIMIT 3);")
    sql_lines.append("")

    # 3. Insert Site Settings
    sql_lines.append("-- =========================================================================")
    sql_lines.append("-- 3. INSERT SITE SETTINGS")
    sql_lines.append("-- =========================================================================")
    
    settings = {
        'site_status': 'live',
        'whatsapp_number': '918421949875',
        'homepage_banner': {
            'title': 'Kalaasutra by Shubham Art',
            'subtitle': 'Handcrafted customized artwork, LED signboards, and premium nameplates for your special ones.',
            'image_url': 'hero_bg.jpg'
        },
        'active_theme': 'premium',
        'delivery_message': 'Express delivery all over India. Handcrafted sketches shipped within 7-9 business days.',
        'announcement_bar': '🎉 Flat 10% Off on Anniversary & Birthday Portraits! Use code FESTIVE10 at checkout.',
        'payment_instructions': 'Kindly scan the UPI QR code or pay to mobile number +91 8421949875 (Shubham Sutar). Share your order number and transaction screenshot on WhatsApp to activate your order.',
        'faq': [
            {
                'question': 'How do I place a custom order?',
                'answer': 'Choose your product, click "Customize Preview" to enter details (names, styles, reference images), and click "Order via WhatsApp". The website will generate a pre-filled WhatsApp message. Once you send it, our artist will confirm details and share payment options.'
            },
            {
                'question': 'Can I get my portrait framed?',
                'answer': 'Yes! We offer options for premium Black Classic frames or Warm Wooden frames for physical deliveries. You can also opt for unframed rolled sketches or a high-resolution digital copy.'
            },
            {
                'question': 'How long does delivery take?',
                'answer': 'Since each artwork is hand-drawn and customized with precision, creation takes 3-5 days. Shipping takes another 3-4 days. Total delivery time is approximately 7-9 business days across India.'
            },
            {
                'question': 'What are the payment modes?',
                'answer': 'We support payments via UPI (GPay, PhonePe, Paytm) and direct bank transfers. You will need to share the payment screenshot on WhatsApp to finalize your order.'
            }
        ]
    }

    for key, val in settings.items():
        s_uuid = str(uuid.uuid4())
        sql_lines.append(
            f"INSERT INTO public.site_settings (id, key, value, updated_at) "
            f"VALUES ('{s_uuid}', '{key}', {escape_json(val)}, now());"
        )

    sql_lines.append("")
    sql_lines.append("-- =========================================================================")
    sql_lines.append("-- 4. INSERT OFFERS")
    sql_lines.append("-- =========================================================================")

    # Offer 1: Festive 10%
    off1_uuid = str(uuid.uuid4())
    sql_lines.append(
        f"INSERT INTO public.offers (id, title, code, description, discount_type, discount_value, starts_at, ends_at, is_active, banner_image_url, applies_to, minimum_order_value, created_at, updated_at) "
        f"VALUES ('{off1_uuid}', 'Festive Celebration Sale', 'FESTIVE10', 'Enjoy a flat 10% discount on all custom sketches and portrait orders.', 'percentage', 10.00, now(), now() + interval '90 days', true, 'festive_offer_banner.jpg', 'all_products', 499.00, now(), now());"
    )

    # Offer 2: First Order 50 INR
    off2_uuid = str(uuid.uuid4())
    sql_lines.append(
        f"INSERT INTO public.offers (id, title, code, description, discount_type, discount_value, starts_at, ends_at, is_active, banner_image_url, applies_to, minimum_order_value, created_at, updated_at) "
        f"VALUES ('{off2_uuid}', 'Welcome First Order Discount', 'FIRST50', 'Get a flat ₹50 discount on your first order. Minimum purchase ₹299.', 'fixed_amount', 50.00, now(), now() + interval '365 days', true, 'welcome_offer_banner.jpg', 'all_products', 299.00, now(), now());"
    )

    sql_lines.append("")
    sql_lines.append("-- =========================================================================")
    sql_lines.append("-- 5. INSERT TESTIMONIALS")
    sql_lines.append("-- =========================================================================")

    testimonials = [
        ("Aarav Mehta", "Ordered an anniversary A3 sketch frame for my wife. The details were incredible and looked exactly like the reference photo. She loved it! Fast shipping too.", 5, "whatsapp"),
        ("Priya Deshmukh", "The Acrylic LED Nameplate is of premium quality. The light is bright and the calligraphy font is gorgeous. Highly recommended for home decor!", 5, "instagram"),
        ("Rohan Joshi", "Got a metal keychain with my name. Excellent build quality, and it feels heavy and premium. Truly value for money.", 4, "instagram"),
        ("Neha Shinde", "Amazing customer support! They kept me updated during the sketch creation and took my feedback positively before shipping.", 5, "website")
    ]

    for name, msg, rating, source in testimonials:
        t_uuid = str(uuid.uuid4())
        sql_lines.append(
            f"INSERT INTO public.testimonials (id, customer_name, message, rating, source, is_visible, display_order, created_at) "
            f"VALUES ('{t_uuid}', {escape_sql(name)}, {escape_sql(msg)}, {rating}, '{source}', true, 0, now());"
        )

    sql_lines.append("")
    sql_lines.append("COMMIT;")

    out_dir = os.path.dirname(json_path).replace('data/shubham_art', 'supabase') # target path 'supabase/seed.sql'
    out_path = os.path.join('supabase', 'seed.sql')
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Success! Generated {out_path} with {len(products)} products and support data.")

if __name__ == '__main__':
    main()

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const uuidv4 = () => crypto.randomUUID();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '');
}

async function insertTable(table, data) {
  if (data.length === 0) return;
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Error inserting into ${table}:`, text);
  } else {
    console.log(`Inserted ${data.length} records into ${table}`);
  }
}

async function seed() {
  const jsonPath = path.join(process.cwd(), 'data', 'shubham_art', 'products.json');
  const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const categories = {};
  const categoryNames = [...new Set(products.map(p => p.category || 'Paintings'))].sort();
  
  categoryNames.forEach((name, idx) => {
    categories[name] = {
      id: uuidv4(),
      slug: slugify(name),
      display_order: idx + 1
    };
  });

  const categoriesData = Object.entries(categories).map(([name, cat]) => ({
    id: cat.id,
    name: name,
    slug: cat.slug,
    description: `Handcrafted ${name} and personalized art pieces.`,
    display_order: cat.display_order,
    is_active: true
  }));

  await insertTable('categories', categoriesData);

  const productsData = [];
  const mediaData = [];
  const optionsData = [];
  const variantsData = [];

  products.forEach(p => {
    const pId = uuidv4();
    const catName = p.category || 'Paintings';
    const catId = categories[catName].id;
    
    let status = 'available';
    if (p.availability === 'Custom Order') status = 'custom_order';
    if (p.availability === 'Sold') status = 'sold';

    const isCustomizable = (p.customization_fields || []).length > 0;
    const material = (p.materials && p.materials.length > 0) ? p.materials[0] : null;
    const colorTheme = (p.color_options && p.color_options.length > 0) ? p.color_options[0] : null;
    
    const title = p.product_name || 'Untitled Artwork';
    const slug = slugify(title);
    const desc = p.description || '';
    const shortDesc = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;

    productsData.push({
      id: pId,
      title: title,
      slug: slug,
      short_description: shortDesc,
      description: desc,
      category_id: catId,
      base_price: p.base_price,
      currency: 'INR',
      status: status,
      is_featured: false,
      is_customizable: isCustomizable,
      estimated_delivery_days: 7,
      material: material,
      color_theme: colorTheme,
      seo_title: title,
      seo_description: shortDesc,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const mediaList = p.gallery_images || [];
    mediaList.forEach((mediaFile, idx) => {
      mediaData.push({
        id: uuidv4(),
        product_id: pId,
        media_url: mediaFile,
        media_type: 'image',
        alt_text: `${title} Image ${idx + 1}`,
        display_order: idx,
        is_primary: idx === 0
      });
    });

    const customFields = p.customization_fields || [];
    customFields.forEach((field, idx) => {
      let inputType = 'text';
      if (field.type === 'select') inputType = 'dropdown';
      if (field.type === 'color') inputType = 'color';
      if (field.type === 'image') inputType = 'image_upload';

      optionsData.push({
        id: uuidv4(),
        product_id: pId,
        label: field.name || 'Option',
        input_type: inputType,
        required: field.required || false,
        options: field.options || null,
        display_order: idx,
        is_active: true
      });
    });

    const titleLower = title.toLowerCase();
    if (titleLower.includes('sketch') || titleLower.includes('portrait') || titleLower.includes('painting') || titleLower.includes('drawing')) {
      variantsData.push({ id: uuidv4(), product_id: pId, name: 'Size', option_name: 'A4 (Standard)', price_adjustment: 0, is_active: true });
      variantsData.push({ id: uuidv4(), product_id: pId, name: 'Size', option_name: 'A3 (Medium)', price_adjustment: 500, is_active: true });
      variantsData.push({ id: uuidv4(), product_id: pId, name: 'Size', option_name: 'A2 (Large)', price_adjustment: 1200, is_active: true });
      
      variantsData.push({ id: uuidv4(), product_id: pId, name: 'Frame', option_name: 'Unframed (Roll / Digital)', price_adjustment: 0, is_active: true });
      variantsData.push({ id: uuidv4(), product_id: pId, name: 'Frame', option_name: 'Black Classic Frame', price_adjustment: 250, is_active: true });
      variantsData.push({ id: uuidv4(), product_id: pId, name: 'Frame', option_name: 'Warm Wooden Frame', price_adjustment: 300, is_active: true });
    }
  });

  // Mark top 3 as featured
  productsData.slice(0, 3).forEach(p => p.is_featured = true);

  await insertTable('products', productsData);
  await insertTable('product_media', mediaData);
  await insertTable('custom_options', optionsData);
  await insertTable('product_variants', variantsData);

  const siteSettingsData = [
    { id: uuidv4(), key: 'site_status', value: 'live', updated_at: new Date().toISOString() },
    { id: uuidv4(), key: 'whatsapp_number', value: '918421949875', updated_at: new Date().toISOString() },
    { id: uuidv4(), key: 'homepage_banner', value: { title: 'Kalaasutra by Shubham Art', subtitle: 'Handcrafted customized artwork', image_url: 'hero_bg.jpg' }, updated_at: new Date().toISOString() },
    { id: uuidv4(), key: 'active_theme', value: 'premium', updated_at: new Date().toISOString() },
    { id: uuidv4(), key: 'delivery_message', value: 'Express delivery all over India.', updated_at: new Date().toISOString() },
    { id: uuidv4(), key: 'announcement_bar', value: '🎉 Flat 10% Off! Use code FESTIVE10 at checkout.', updated_at: new Date().toISOString() }
  ];
  await insertTable('site_settings', siteSettingsData);

  const offersData = [
    {
      id: uuidv4(), title: 'Festive Celebration Sale', code: 'FESTIVE10', description: 'Enjoy a flat 10% discount', discount_type: 'percentage', discount_value: 10,
      starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 90*86400000).toISOString(), is_active: true, banner_image_url: 'festive_offer_banner.jpg',
      applies_to: 'all_products', minimum_order_value: 499, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
  ];
  await insertTable('offers', offersData);

  const testimonialsData = [
    { id: uuidv4(), customer_name: 'Aarav Mehta', message: 'Ordered an anniversary A3 sketch frame for my wife. The details were incredible!', rating: 5, source: 'whatsapp', is_visible: true, display_order: 0, created_at: new Date().toISOString() },
    { id: uuidv4(), customer_name: 'Priya Deshmukh', message: 'The Acrylic LED Nameplate is of premium quality.', rating: 5, source: 'instagram', is_visible: true, display_order: 1, created_at: new Date().toISOString() },
    { id: uuidv4(), customer_name: 'Rohan Joshi', message: 'Got a metal keychain with my name. Excellent build quality!', rating: 4, source: 'instagram', is_visible: true, display_order: 2, created_at: new Date().toISOString() }
  ];
  await insertTable('testimonials', testimonialsData);

  console.log("Seeding complete!");
}

seed();

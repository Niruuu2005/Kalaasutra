import json
import csv
import sys
import os

# Ensure system uses utf-8
sys.stdout.reconfigure(encoding='utf-8')

# Paths
DATA_DIR = r"d:\Projects\Kalaasutra\data\shubham_art"
CHECKPOINT_PATH = os.path.join(DATA_DIR, "products_checkpoint.json")
OUTPUT_JSON_PATH = os.path.join(DATA_DIR, "products.json")
OUTPUT_CSV_PATH = os.path.join(DATA_DIR, "products.csv")
MEDIA_INV_PATH = os.path.join(DATA_DIR, "media_inventory.csv")
REPORT_PATH = os.path.join(DATA_DIR, "business_analysis.md")

# Define base product configurations
BASE_PRODUCTS = {
    "KP001": {
        "product_id": "KP001",
        "product_name": "Custom Engraved Metal Name Keychain",
        "category": "Custom Keychains",
        "description": "High-quality, polished steel or brass metal keychain customized with your name in beautiful Devanagari calligraphy or English script. Laser-cut to precision, offering a glossy and premium finish. Ideal for keys, backpacks, and personal gifting.",
        "customization_fields": [
            {"name": "Custom Name / Text", "type": "text", "required": True, "placeholder": "Enter name (e.g., Mahakal, Pooja)"},
            {"name": "Font Style / Language", "type": "select", "options": ["Devanagari Calligraphy", "English Script", "Standard Bold"], "required": True},
            {"name": "Material / Finish", "type": "select", "options": ["Glossy Steel", "Rose Gold Titanium", "Matte Black Metal"], "required": True}
        ],
        "base_price": 199,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Metal", "Stainless Steel"],
        "color_options": ["Silver", "Rose Gold", "Titanium Black"]
    },
    "KP002": {
        "product_id": "KP002",
        "product_name": "Custom Vehicle Number Plate Keychain",
        "category": "Custom Keychains",
        "description": "Personalized mini vehicle license plate keychain designed to match your bike or car number plate. Laser-engraved for durability and long-lasting quality. A perfect gift for automobile enthusiasts.",
        "customization_fields": [
            {"name": "Vehicle Number / Text", "type": "text", "required": True, "placeholder": "e.g., MH 12 AB 1234"},
            {"name": "Design Type", "type": "select", "options": ["Standard Car Plate", "Standard Bike Plate", "Custom Font Layout"], "required": True}
        ],
        "base_price": 149,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Metal", "Acrylic"],
        "color_options": ["White and Black", "Yellow and Black"]
    },
    "KP003": {
        "product_id": "KP003",
        "product_name": "Custom Acrylic Keychain",
        "category": "Custom Keychains",
        "description": "Vibrant, lightweight, and durable custom acrylic keychains. Can be printed with company logos, custom graphics, or personalized text. Perfect for corporate promotions, branding, or bulk gifting.",
        "customization_fields": [
            {"name": "Custom Text / Logo Upload", "type": "text", "required": True, "placeholder": "Enter text or upload logo"},
            {"name": "Acrylic Type", "type": "select", "options": ["Clear Acrylic", "Black Acrylic", "White Acrylic"], "required": True}
        ],
        "base_price": 99,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Acrylic"],
        "color_options": ["Clear", "Black", "White"]
    },
    "KP004": {
        "product_id": "KP004",
        "product_name": "Custom Acrylic LED Backlit Nameplate",
        "category": "Wall Art & Nameplates",
        "description": "Premium illuminated house or office nameplate. Made with durable acrylic and backlit with high-quality, long-lasting LED lights. Weatherproof and ideal for outdoor or indoor placement. Creates a beautiful glowing effect at night.",
        "customization_fields": [
            {"name": "Name(s) to Display", "type": "text", "required": True, "placeholder": "Enter name(s)"},
            {"name": "LED Light Color", "type": "select", "options": ["Warm White", "Cool White", "Vibrant Blue", "RGB Multi-color (with remote)"], "required": True},
            {"name": "Backing Board Material", "type": "select", "options": ["Black Gloss Acrylic", "Wooden Finish ACP", "Transparent Acrylic"], "required": True}
        ],
        "base_price": 1499,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Acrylic", "LED Lights"],
        "color_options": ["Warm White", "Cool White", "Blue", "Multi-color LED"]
    },
    "KP005": {
        "product_id": "KP005",
        "product_name": "Personalized Door Nameplate",
        "category": "Wall Art & Nameplates",
        "description": "Elegant, non-illuminated nameplate for homes, bungalows, or offices. Features custom fonts, laser-cut letters, and high-quality finishes (wood, acrylic, or composite materials) that add an inviting touch to your entrance.",
        "customization_fields": [
            {"name": "Name(s) to Display", "type": "text", "required": True, "placeholder": "e.g., The Sutar Family"},
            {"name": "Material Theme", "type": "select", "options": ["Natural Wood Finish", "Glossy Black Acrylic", "Rose Gold Titanium Plate"], "required": True},
            {"name": "Mounting Type", "type": "select", "options": ["Wall Mount Screws", "Double-sided Industrial Tape", "Hanging Chain"], "required": True}
        ],
        "base_price": 799,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Acrylic", "Wood", "Metal"],
        "color_options": ["Customized Color", "Golden", "Rose Gold"]
    },
    "KP006": {
        "product_id": "KP006",
        "product_name": "Personalized Desk Name Stand",
        "category": "Desk Organizers & Stands",
        "description": "Customized wooden or acrylic name stand designed for office desks, study tables, or reception counters. Showcases your name and designation in a sleek, professional layout.",
        "customization_fields": [
            {"name": "Name to Display", "type": "text", "required": True, "placeholder": "e.g., Shubham Sutar"},
            {"name": "Designation / Subtext", "type": "text", "required": False, "placeholder": "e.g., Civil Engineer"},
            {"name": "Material Type", "type": "select", "options": ["Premium Oak Wood", "Dark Walnut Wood", "Black Acrylic"], "required": True}
        ],
        "base_price": 399,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Wood", "Acrylic"],
        "color_options": ["Natural Wood", "Black Gloss"]
    },
    "KP007": {
        "product_id": "KP007",
        "product_name": "Personalized Desk Name Stand with Pen Holder",
        "category": "Desk Organizers & Stands",
        "description": "Functional and elegant desk organizer combining a customized name stand with integrated pen/pencil slots. Hand-crafted from premium wood materials, ideal for professionals, lawyers, and advocates.",
        "customization_fields": [
            {"name": "Name to Display", "type": "text", "required": True, "placeholder": "e.g., Adv. Rajesh Patil"},
            {"name": "Designation / Logo (e.g., Law Scales)", "type": "text", "required": False, "placeholder": "Designation/Logo details"},
            {"name": "Pen Slots Quantity", "type": "select", "options": ["Single Slot", "Double Slot", "Multi-slot Organizer"], "required": True}
        ],
        "base_price": 599,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Wood", "Metal"],
        "color_options": ["Natural Oak", "Polished Walnut"]
    },
    "KP008": {
        "product_id": "KP008",
        "product_name": "Custom Wooden Pen Stand & Organizer",
        "category": "Desk Organizers & Stands",
        "description": "Premium desk pen stand engraved with your company logo, personal brand, or custom name. Made from high-quality polished wood, it makes an excellent corporate or office gift.",
        "customization_fields": [
            {"name": "Engraving Text / Logo Details", "type": "text", "required": True, "placeholder": "Enter name or logo details"},
            {"name": "Wood Color", "type": "select", "options": ["Natural Light Wood", "Polished Mahogany"], "required": True}
        ],
        "base_price": 299,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Wood"],
        "color_options": ["Natural Light", "Polished Mahogany"]
    },
    "KP009": {
        "product_id": "KP009",
        "product_name": "Custom Engraved Name Pen",
        "category": "Writing Instruments",
        "description": "Sleek metal body pen custom-engraved with your name. Features smooth ink flow and a premium feel. Packaged elegantly, making it a thoughtful gift for writers, teachers, and professionals.",
        "customization_fields": [
            {"name": "Name to Engrave", "type": "text", "required": True, "placeholder": "Enter Name (Max 20 chars)"},
            {"name": "Pen Body Color", "type": "select", "options": ["Matte Black with Gold Trim", "Glossy Silver", "Metallic Blue"], "required": True}
        ],
        "base_price": 199,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Metal"],
        "color_options": ["Matte Black", "Glossy Silver", "Metallic Blue"]
    },
    "KP010": {
        "product_id": "KP010",
        "product_name": "Custom Engraved Stainless Steel Bottle",
        "category": "Drinkware",
        "description": "Durable, eco-friendly stainless steel water bottle personalized with high-precision laser engraving. Leakproof and designed for daily use at school, office, or gym.",
        "customization_fields": [
            {"name": "Name / Text to Engrave", "type": "text", "required": True, "placeholder": "Enter Name or Initials"},
            {"name": "Bottle Color", "type": "select", "options": ["Matte Black", "Metallic Silver", "Vibrant Red", "Deep Blue"], "required": True}
        ],
        "base_price": 499,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Stainless Steel"],
        "color_options": ["Matte Black", "Metallic Silver", "Red", "Blue"]
    },
    "KP011": {
        "product_id": "KP011",
        "product_name": "Custom Leatherette Diary",
        "category": "Leather Diaries & Notebooks",
        "description": "Elegant leatherette cover diary with personalized name engraving or logo UV print. Includes ruled sheets of high-quality paper, ideal for journaling, note-taking, or corporate planning.",
        "customization_fields": [
            {"name": "Name to Engrave / Emboss", "type": "text", "required": True, "placeholder": "Enter Name"},
            {"name": "Diary Cover Color", "type": "select", "options": ["Classic Brown", "Midnight Black", "Tan Leather", "Navy Blue"], "required": True}
        ],
        "base_price": 349,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Leatherette", "Paper"],
        "color_options": ["Brown", "Black", "Tan", "Navy Blue"]
    },
    "KP012": {
        "product_id": "KP012",
        "product_name": "Executive Diary & Engraved Pen Gift Set",
        "category": "Leather Diaries & Notebooks",
        "description": "A premium gift combo containing a personalized leatherette diary and a matching custom-engraved name pen. Perfectly packaged in a gift box, making it a highly professional corporate gift set.",
        "customization_fields": [
            {"name": "Name for Diary & Pen", "type": "text", "required": True, "placeholder": "Enter Name for personalization"},
            {"name": "Gift Set Theme Color", "type": "select", "options": ["Matching Brown Set", "Matching Black Set", "Tan Leather Set"], "required": True}
        ],
        "base_price": 549,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Leatherette", "Metal", "Paper"],
        "color_options": ["Matching Brown", "Matching Black", "Tan Leather"]
    },
    "KP013": {
        "product_id": "KP013",
        "product_name": "Custom Acrylic / ACP UV Printed Photo Plaque",
        "category": "UV Prints & Photo Plaques",
        "description": "High-definition UV printing directly on acrylic or aluminum composite panels (ACP). Captures vibrant colors and fine details, creating a modern, borderless frame effect for photos, memorials, or brand statements.",
        "customization_fields": [
            {"name": "Photo Upload / Text Details", "type": "text", "required": True, "placeholder": "Provide photo reference or text"},
            {"name": "Material Type", "type": "select", "options": ["Glossy Acrylic (3mm)", "ACP Brushed Metal Finish"], "required": True},
            {"name": "Size Option", "type": "select", "options": ["A5 Small", "A4 Medium", "A3 Large"], "required": True}
        ],
        "base_price": 699,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Acrylic", "ACP Panel"],
        "color_options": ["Multicolor UV Print"]
    },
    "KP014": {
        "product_id": "KP014",
        "product_name": "Custom Acrylic Trophy & Memento",
        "category": "Trophies & Mementos",
        "description": "Tailor-made trophies and mementos designed for corporate achievements, festivals, or family appreciation (e.g. 'Best Sister'). Features high-precision acrylic cutting and custom printing.",
        "customization_fields": [
            {"name": "Title Text", "type": "text", "required": True, "placeholder": "e.g., Best Sis in the World"},
            {"name": "Awardee / Subtext", "type": "text", "required": False, "placeholder": "Awardee name/details"},
            {"name": "Trophy Shape", "type": "select", "options": ["Star Shield", "Classic Rectangular", "Custom Cutout Shape"], "required": True}
        ],
        "base_price": 349,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Acrylic"],
        "color_options": ["Custom Printing"]
    },
    "KP015": {
        "product_id": "KP015",
        "product_name": "Personalized Metal Kada / Bracelet",
        "category": "Jewelry & Accessories",
        "description": "Stylish, adjustable stainless steel Kada (wrist bracelet) customized with your name or special text engraved. Comfortable for daily wear and resistant to rust or tarnishing.",
        "customization_fields": [
            {"name": "Name to Engrave", "type": "text", "required": True, "placeholder": "Enter Name / Text"},
            {"name": "Finish Option", "type": "select", "options": ["Polished Silver", "Rose Gold", "Gold Plated"], "required": True}
        ],
        "base_price": 299,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Stainless Steel"],
        "color_options": ["Silver", "Rose Gold", "Gold"]
    },
    "KP016": {
        "product_id": "KP016",
        "product_name": "Custom Pearl Pendant Necklace",
        "category": "Jewelry & Accessories",
        "description": "Elegant necklace featuring a pearl accent and a customized locket pendant. A delicate and beautiful jewelry piece perfect for special occasions, anniversaries, or Valentine's gifting.",
        "customization_fields": [
            {"name": "Locket Text / Initial", "type": "text", "required": True, "placeholder": "Enter name or initial"},
            {"name": "Locket Finish", "type": "select", "options": ["Rose Gold", "Gold Plated", "Silver Finish"], "required": True}
        ],
        "base_price": 399,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Metal", "Pearls"],
        "color_options": ["Rose Gold", "Gold", "Silver"]
    },
    "KP017": {
        "product_id": "KP017",
        "product_name": "Custom Engraved Pet Name Tag",
        "category": "Pet Accessories",
        "description": "Mini name tags for dogs and cats. Custom engraved with the pet's name on the front and owner's contact details on the back. Lightweight, rustproof, and designed to attach easily to collars.",
        "customization_fields": [
            {"name": "Pet's Name", "type": "text", "required": True, "placeholder": "e.g., Rocky"},
            {"name": "Owner's Phone Number", "type": "text", "required": True, "placeholder": "e.g., 9876543210"},
            {"name": "Tag Shape", "type": "select", "options": ["Bone Shape", "Heart Shape", "Classic Circle"], "required": True}
        ],
        "base_price": 129,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Metal"],
        "color_options": ["Silver", "Gold", "Red", "Blue"]
    },
    "KP018": {
        "product_id": "KP018",
        "product_name": "Custom 3D Metal / Acrylic Letters",
        "category": "Business Signage & Letters",
        "description": "Premium 3D individual cut-out letters made of stainless steel (SS Rose Gold, Titanium) or acrylic. Perfect for mounting on home bungalow walls, building facades, or office reception backdrops.",
        "customization_fields": [
            {"name": "Text to Display", "type": "text", "required": True, "placeholder": "Enter words/letters"},
            {"name": "Material / Color Finish", "type": "select", "options": ["SS Rose Gold Titanium", "SS Mirror Gold", "Glossy Black Acrylic", "White Acrylic"], "required": True},
            {"name": "Letter Height (inches)", "type": "select", "options": ["4 inches", "6 inches", "8 inches", "12 inches", "Custom Size"], "required": True}
        ],
        "base_price": 1999,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Metal", "Acrylic", "Stainless Steel"],
        "color_options": ["Rose Gold Titanium", "Mirror Gold", "Black", "White"]
    },
    "KP019": {
        "product_id": "KP019",
        "product_name": "Custom Business Signage & Branding Plate",
        "category": "Business Signage & Letters",
        "description": "Customized brand signs, signage frames, machine rating plates, and promotional branding plates. Tailor-made for storefronts, industrial machinery labeling, or brand setups.",
        "customization_fields": [
            {"name": "Signage Details / Requirements", "type": "text", "required": True, "placeholder": "Explain requirements / dimensions"},
            {"name": "Material Selection", "type": "select", "options": ["Acrylic", "ACP Sheet", "Metal Engraved Plate"], "required": True}
        ],
        "base_price": 999,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Acrylic", "ACP Panel", "Metal"],
        "color_options": ["Custom Design"]
    },
    "KP020": {
        "product_id": "KP020",
        "product_name": "Custom Religious / Decorative Art Plaque",
        "category": "Wall Art & Nameplates",
        "description": "Artistic wall or desk plaques featuring Hindu deities (Ganesha, Swami Samarth, etc.) or decorative spiritual calligraphic motifs. Crafted with acrylic/wood overlays for a 3D layered look.",
        "customization_fields": [
            {"name": "Deity / Art Theme", "type": "select", "options": ["Ganesha Art", "Shree Swami Samarth", "Mahakal Calligraphy Art", "Custom Spiritual Symbol"], "required": True},
            {"name": "Mounting Type", "type": "select", "options": ["Wall Mount", "Desk Stand (with base)"], "required": True}
        ],
        "base_price": 499,
        "currency": "INR",
        "availability": "Custom Order",
        "materials": ["Wood", "Acrylic"],
        "color_options": ["Multicolor", "Golden", "Rose Gold"]
    },
    "KP021": {
        "product_id": "KP021",
        "product_name": "Non-Catalog Brand Showcase",
        "category": "Brand Showcase",
        "description": "Portfolio posts showing Kalaasutra workshop capabilities, laser/UV machinery in action (e.g. UV marking machine setup), or general contact details. Not a retail product.",
        "customization_fields": [],
        "base_price": 0,
        "currency": "INR",
        "availability": "Showcase Only",
        "materials": [],
        "color_options": []
    }
}

def map_post_to_base_product(p):
    pid = p.get('product_id', '')
    name = p.get('product_name', '')
    cat = p.get('category', '')
    cap = p.get('source_caption', '').lower()
    
    # 1. Non-catalog/showcase machine setups and contact cards
    if pid in ["SA013", "SA061", "SA027"]: 
        return "KP021"
    
    # 2. Executive combo sets (Diary + Pen)
    if pid in ["SA056", "SA059"]:
        return "KP012"
        
    # 3. Desk name stands & Pen stands
    if pid in ["SA035", "SA038", "SA048"]: # stands with pens (e.g., advocate stand)
        return "KP007"
    if pid in ["SA047"]: # wooden pen stand only
        return "KP008"
    if pid in ["SA003", "SA011"]: # desk name stands only
        return "KP006"
        
    # 4. Keychains
    if pid in ["SA009", "SA043"]: # Vehicle Number keychains
        return "KP002"
    if pid in ["SA053"]: # Acrylic promotional/bulk keychains
        return "KP003"
    
    # Other Keychains
    if cat == "Custom Keychain" or "keychain" in name.lower() or "keychain" in cap:
        return "KP001"
        
    # 5. Bottles
    if pid in ["SA019", "SA041"] or "bottle" in name.lower() or "bottle" in cap:
        return "KP010"
        
    # 6. Pens
    if pid in ["SA010", "SA020", "SA030", "SA063"] or "pen" in name.lower() or "pen" in cap:
        return "KP009"
        
    # 7. Diaries
    if pid in ["SA052"] or "diary" in name.lower() or "diary" in cap:
        return "KP011"
        
    # 8. Nameplates & LED Nameplates
    if pid in ["SA018", "SA058"] or "led" in cap or "backlit" in name.lower() or "backlit" in cap:
        return "KP004"
    if pid in ["SA002", "SA016", "SA024", "SA031", "SA036", "SA049"] or "nameplate" in name.lower() or "name plate" in name.lower() or "nameplate" in cap or "name plate" in cap or "नेमप्लेट" in name or "नेम प्लेट" in name or "नेमप्लेट" in cap or "नेम प्लेट" in cap:
        return "KP005"
        
    # 9. Jewelry & Kada
    if pid in ["SA057"] or "kada" in name.lower() or "kada" in cap or "bracelet" in cap:
        return "KP015"
    if pid in ["SA055"] or "pearl" in name.lower() or "pearl" in cap or "locket" in cap:
        return "KP016"
        
    # 10. Pet Tag
    if pid in ["SA006"] or "pet" in name.lower() or "dog" in name.lower() or "cats" in name.lower() or "nametag" in name.lower() or "nametag" in cap:
        return "KP017"
        
    # 11. 3D Letters
    if pid in ["SA022", "SA026"] or "letters" in name.lower() or "letters" in cap:
        return "KP018"
        
    # 12. Signage & Industrial Machine Plates
    if pid in ["SA014", "SA037", "SA039", "SA044", "SA046"] or "signange" in name.lower() or "signange" in cap or "signage" in cap or "machine plate" in name.lower() or "machine plate" in cap:
        return "KP019"
        
    # 13. Trophies & Mementos
    if pid in ["SA007", "SA029", "SA051"] or "trophy" in name.lower() or "trophy" in cap or "momentoo" in name.lower() or "momentoo" in cap or "memento" in cap:
        return "KP014"
        
    # 14. UV Prints & Plaque
    if pid in ["SA005", "SA040"] or "uv print" in name.lower() or "uv print" in cap or "uv printing" in cap:
        return "KP013"
        
    # 15. Religious / Spiritual Art
    if pid in ["SA004", "SA012", "SA050"] or "ganesha" in name.lower() or "ganesha" in cap or "नारायण" in name or "नारायण" in cap or "बोरन्हान" in name or "बोरन्हान" in cap:
        return "KP020"

    # Specific showcase fallback for other non-specific items
    if pid in ["SA028", "SA054"]:
        # SA028: RakshaBandhan Gift 1.0 (showcase/special event)
        # SA054: "Because some names deserve to be remembered..."
        return "KP021"

    # Default fallback for the remaining unknown name items:
    # Since they have name "Unknown" and no descriptive captions, they represent one-off custom designs.
    # Putting them in KP021 (Non-Catalog Brand Showcase) keeps the catalog clean of empty/nameless products.
    if name == "Unknown" or cat == "Other":
        return "KP021"

    return "KP021"

def main():
    # 1. Load Raw Dataset
    if not os.path.exists(CHECKPOINT_PATH):
        print(f"Error: Raw checkpoint file not found at {CHECKPOINT_PATH}")
        sys.exit(1)
        
    with open(CHECKPOINT_PATH, 'r', encoding='utf-8') as f:
        raw_products = json.load(f)
    print(f"Loaded {len(raw_products)} raw products from checkpoint.")

    # Initialize groupings
    grouped_posts = {kpid: [] for kpid in BASE_PRODUCTS.keys()}
    
    # Map each raw item
    for p in raw_products:
        kpid = map_post_to_base_product(p)
        grouped_posts[kpid].append(p)

    # 2. Build Consolidated Products List
    consolidated_products = []
    
    for kpid, posts in grouped_posts.items():
        base = BASE_PRODUCTS[kpid]
        
        # Gather all materials and colors present in this group
        materials_set = set(base.get("materials", []))
        colors_set = set(base.get("color_options", []))
        gallery_images = []
        source_posts = []
        scraped_variants = []
        
        for p in posts:
            # Add material
            m = p.get("material", "Not mentioned")
            if m and m != "Not mentioned":
                materials_set.add(m)
                
            # Add color theme
            c = p.get("color_theme", "Customized Color")
            if c and c != "Customized Color" and c != "Not mentioned":
                colors_set.add(c)
                
            # Add media paths
            for path in p.get("local_media_paths", []):
                if path not in gallery_images:
                    gallery_images.append(path)
                    
            # Add source post url
            url = p.get("source_post_url")
            if url and url not in source_posts:
                source_posts.append(url)
                
            # Create variant descriptor
            variant_name = p.get("product_name", "Custom Design")
            if variant_name == "Unknown":
                variant_name = f"Custom Design (Post {p.get('product_id')})"
            scraped_variants.append({
                "original_product_id": p.get("product_id"),
                "variant_name": variant_name,
                "source_post_url": p.get("source_post_url"),
                "date_posted": p.get("date_posted")
            })

        # Base product values update
        base_product = {
            "product_id": base["product_id"],
            "product_name": base["product_name"],
            "category": base["category"],
            "description": base["description"],
            "customization_fields": base["customization_fields"],
            "base_price": base["base_price"],
            "currency": base["currency"],
            "availability": base["availability"],
            "materials": sorted(list(materials_set)),
            "color_options": sorted(list(colors_set)),
            "gallery_images": gallery_images,
            "source_posts": source_posts,
            "scraped_variants": scraped_variants
        }
        consolidated_products.append(base_product)

    # 3. Write consolidated products.json
    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(consolidated_products, f, indent=2, ensure_ascii=False)
    print(f"Wrote consolidated products to {OUTPUT_JSON_PATH}")

    # 4. Write consolidated products.csv
    csv_columns = [
        "product_id", "product_name", "category", "description", 
        "customization_fields", "base_price", "currency", "availability", 
        "materials", "color_options", "gallery_images_count", "variants_count"
    ]
    with open(OUTPUT_CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=csv_columns)
        writer.writeheader()
        for cp in consolidated_products:
            writer.writerow({
                "product_id": cp["product_id"],
                "product_name": cp["product_name"],
                "category": cp["category"],
                "description": cp["description"],
                "customization_fields": json.dumps(cp["customization_fields"], ensure_ascii=False),
                "base_price": cp["base_price"],
                "currency": cp["currency"],
                "availability": cp["availability"],
                "materials": ", ".join(cp["materials"]),
                "color_options": ", ".join(cp["color_options"]),
                "gallery_images_count": len(cp["gallery_images"]),
                "variants_count": len(cp["scraped_variants"])
            })
    print(f"Wrote consolidated CSV to {OUTPUT_CSV_PATH}")

    # 5. Re-generate media_inventory.csv mapping original media to base products
    # Columns: media_id, product_id (consolidated), media_type, file_name, file_path, source_post_url, notes
    # Let's rebuild the media registry
    media_rows = []
    for cp in consolidated_products:
        kpid = cp["product_id"]
        # Find all raw posts that mapped to this consolidated product
        for variant in cp["scraped_variants"]:
            orig_pid = variant["original_product_id"]
            # Find the original post details
            orig_post = next((p for p in raw_products if p["product_id"] == orig_pid), None)
            if orig_post:
                media_paths = orig_post.get("local_media_paths", [])
                media_type = orig_post.get("media_type", "reel")
                post_url = orig_post.get("source_post_url", "")
                
                for idx, filename in enumerate(media_paths):
                    media_id = f"M_{orig_pid}_{idx+1:02d}"
                    notes = f"Visual variant showing '{variant['variant_name']}' under base product '{cp['product_name']}'."
                    media_rows.append({
                        "media_id": media_id,
                        "product_id": kpid,
                        "media_type": media_type,
                        "file_name": filename,
                        "file_path": f"/data/shubham_art/media/{filename}",
                        "source_post_url": post_url,
                        "notes": notes
                    })
                    
    with open(MEDIA_INV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["media_id", "product_id", "media_type", "file_name", "file_path", "source_post_url", "notes"])
        writer.writeheader()
        writer.writerows(media_rows)
    print(f"Wrote updated media inventory to {MEDIA_INV_PATH}")

    # 6. Print consolidation summary
    print("\n--- Summary of Consolidation ---")
    active_catalog_count = 0
    showcase_count = 0
    for cp in consolidated_products:
        pid = cp["product_id"]
        pname = cp["product_name"]
        var_count = len(cp["scraped_variants"])
        gal_count = len(cp["gallery_images"])
        if pid == "KP021":
            showcase_count = var_count
            print(f"[Showcase] {pid} | {pname}: {var_count} posts (not for retail catalog)")
        else:
            active_catalog_count += var_count
            print(f"[Catalog]  {pid} | {pname}: {var_count} variants grouped, {gal_count} gallery images")
            
    print(f"\nConsolidated: {len(raw_products)} raw posts -> {len(consolidated_products)-1} active base catalog products + 1 portfolio showcase.")
    print(f"Active Catalog Items: {active_catalog_count} | Showcase/Portfolio: {showcase_count}")

    # 7. Generate updated business_analysis.md report
    regenerate_report(consolidated_products, active_catalog_count, showcase_count)

def regenerate_report(consolidated_products, active_catalog_count, showcase_count):
    # Calculate stats
    categories_count = {}
    for cp in consolidated_products:
        if cp["product_id"] == "KP021":
            continue
        cat = cp["category"]
        categories_count[cat] = categories_count.get(cat, 0) + len(cp["scraped_variants"])
        
    category_summary_lines = []
    total_active_posts = sum(categories_count.values())
    for cat, cnt in sorted(categories_count.items(), key=lambda x: x[1], reverse=True):
        pct = (cnt / total_active_posts) * 100 if total_active_posts > 0 else 0
        category_summary_lines.append(f"- **{cat}**: {cnt} variants mapped ({pct:.1f}% of active catalog)")

    report_content = f"""# Business Analysis & Website Strategy Report - Kalaasutra (Preprocessed)

## 1. Executive Business Summary
**Kalaasutra by Shubham Art** (@shubham__art) is an Indian custom arts and crafts small business specializing in hand-crafted and personalized products, based in Pune, Maharashtra.
The business profile has an active community of **12.8K followers** with **1,178 posts** on Instagram.
Kalaasutra creates customized premium gifts and decor products, combining digital layout design with physical craftsmanship (acrylic engraving, metal cutouts, LED illumination, and wooden engraving).

### Brand & Communication Channels:
- **Instagram Handle**: [@shubham__art](https://www.instagram.com/shubham__art/)
- **Primary Order Channel**: Direct Message (DM) on Instagram or WhatsApp at **8421949875**.
- **Contact Details**: 
  - WhatsApp/Phone: +91 84219 49875
  - Primary Contact: Shubham Sutar (Civil Engineer turned Digital Artist/Creator)

---

## 2. Product Category & Catalog Analysis (Preprocessed)

By analyzing and preprocessing the collected Instagram dataset of 63 posts, we have consolidated duplicates and similar variants (e.g. differences only in text, font, color, or specific personalization) into a clean, professional e-commerce product catalog.

### Consolidated Catalog Breakdown:
- **Total Scraped Posts/Reels**: 63
- **Active E-Commerce Catalog Products**: 20 distinct base products (covering {active_catalog_count} post variants)
- **Portfolio / Brand Showcase Capability Posts**: 1 showcase category (covering {showcase_count} posts including workshop machine setups, generic cards, and miscellaneous artwork)

### Category Breakdown of the Active Catalog:
{chr(10).join(category_summary_lines)}

### Base Products Catalog List:
Here are the 20 active base products designed for the website's e-commerce inventory:

| Product ID | Base Product Name | Category | Base Price (INR) | Gallery Images | Customization Fields |
| :--- | :--- | :--- | :--- | :---: | :--- |
"""

    for cp in consolidated_products:
        if cp["product_id"] == "KP021":
            continue
        fields = ", ".join([f["name"] for f in cp["customization_fields"]])
        report_content += f"| {cp['product_id']} | {cp['product_name']} | {cp['category']} | {cp['base_price']} | {len(cp['gallery_images'])} | {fields} |\n"

    report_content += """
---

## 3. Brand Style & Visual Identity
- **Visual Style**: Industrial-craft aesthetics. The branding showcases the actual raw materials, the machinery (laser cutting machines in action), and the finished illuminated product.
- **Color Palette**: 
  - Metallic gold and polished silver (common in custom keychains and nameplates).
  - Sleek acrylic black/white backings.
  - Vibrant single-color and multi-color LED backlights (warm white, blue, yellow).
- **Stocking Model**: **100% Order-Based / Custom Made**. Products are made to order based on customer requirements (names, sizes, LED preferences). There is very little "ready-made" inventory, indicating that the website must focus heavily on customization forms and quotation queries.

---

## 4. Pricing & Gifting Logistics Analysis
- **Pricing Visibility**: **Dynamic Quotation Model**. 
  - Since pricing varies depending on the specific customization options (such as size, material thickness, LED inclusions), all base products start at a starting-at/base price.
  - In our database, these base prices have been assigned (e.g. 99-199 INR for keychains, 1499 INR for LED nameplates, 799 INR for non-LED door nameplates) as the starting price point.
- **Trust Signals**:
  - Packaging and shipping previews in stories.
  - Video clips of laser cutters in action, demonstrating high production quality and authenticity.
  - Testimonials and feedback highlights ("Feedback", "Ask me") showing positive customer reviews.
  - Finished products shown with customer names, proving a consistent track record of completed orders.
  - "All India Delivery" is mentioned explicitly, establishing national delivery capability.

---

## 5. E-Commerce Website Opportunities & Roadmap

### Website Design Directions:
- **Mobile-First Design**: Since 90%+ of Instagram traffic is mobile, the website must load lightning-fast and have an intuitive mobile checkout or contact flow.
- **Dynamic Product Configurator**: Instead of a static cart, each product page must render custom input fields dynamically based on the product's `customization_fields` (e.g. "Enter Custom Name", "Select LED Light Color").
- **WhatsApp Checkout Integration**: A prominent "Order via WhatsApp" button on product pages that pre-fills a message containing the product name, ID, and customization details (e.g. "Hi Shubham, I would like to order a Custom Keychain KP001 with the name 'Rahul', Font: Devanagari, Finish: Rose Gold"). This aligns with standard Indian e-commerce buying behavior.

### Suggested Website Sections:
1. **Hero Header**: High-res video banner showing laser cutting or illuminated LED work with a clear CTA: "Order Your Custom Art".
2. **Product Catalog**: Filterable grid (by Keychains, LED Signboards, Nameplates, Desk Organizers, Sketches).
3. **Interactive Quote Estimator**: Simple slider-based configurator for signboards (Size vs. Material -> Estimated Price).
4. **WhatsApp Quick Order Floating Button**: Direct channel for custom queries.
5. **Customer Gallery & Video Reels**: An embedded, fast-loading grid of finished products using the gallery images.
6. **FAQ Section**: Covering delivery times (e.g. "How long does custom order take?"), shipping rates, and payment methods.

### SEO Keyword Suggestions (Indian Audience):
- *Customized keychains India*, *personalized LED nameplate*, *acrylic name plate Pune*, *custom wooden name stand*, *personalized birthday gifts Pune*, *Devanagari calligraphic keychain*, *handmade sketch portrait online*.

---

## 6. Data Collection & Preprocessing Limitations & Notes
- **Consolidation Impact**: Preprocessing has successfully reduced data redundancy by merging 63 flat items into 20 parent products. This prevents catalog clutter (e.g., showing 10 separate entries for slightly different name keychains) while maintaining all 63 visual examples as product variants/gallery references.
- **Pricing Handling**: Prices are set as starting base rates. Real price ranges should be calibrated with the owner Shubham Sutar during site integration.
"""

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(report_content)
    print(f"Successfully generated updated Business Analysis Report at {REPORT_PATH}")

if __name__ == "__main__":
    main()

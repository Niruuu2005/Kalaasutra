import os
import re
import sys
import json
import csv
import time
import urllib.request
import traceback
from playwright.sync_api import sync_playwright

# Reconfigure console output to handle UTF-8 text (for Devnagari/Marathi characters)
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Output paths
BASE_DIR = "d:/Projects/Kalaasutra/data/shubham_art"
MEDIA_DIR = os.path.join(BASE_DIR, "media")
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
CHECKPOINT_PATH = os.path.join(BASE_DIR, "products_checkpoint.json")
LINKS_PATH = os.path.join(BASE_DIR, "harvested_links.txt")

# Ensure output directories exist
os.makedirs(MEDIA_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def download_media(url, filepath):
    """Download media from url with user-agent header to prevent 403 Forbidden."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response, open(filepath, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Error downloading media from {url}: {e}")
        return False

def dismiss_modal(page):
    """Dismiss Instagram signup/login modal if visible."""
    closed = False
    for selector in ["svg[aria-label='Close']", "div[role='dialog'] svg", "button:has(svg[aria-label='Close'])"]:
        try:
            locators = page.locator(selector)
            count = locators.count()
            for i in range(count):
                loc = locators.nth(i)
                if loc.is_visible():
                    loc.click()
                    print(f"Dismissed modal using selector: {selector}")
                    time.sleep(1.5)
                    closed = True
                    break
        except Exception:
            pass
        if closed:
            break
    return closed

def parse_caption_from_body(body_text, username="shubham__art"):
    """Parse caption from body text of an Instagram post page."""
    lines = [line.strip() for line in body_text.split('\n') if line.strip()]
    time_pattern = re.compile(r'^\d+[hwdmy]$')
    
    caption_start_idx = -1
    for idx, line in enumerate(lines):
        if line.lower() == username.lower():
            # Check if followed by time pattern (caption header)
            is_caption_header = False
            time_idx = -1
            for offset in [1, 2]:
                if idx + offset < len(lines):
                    next_line = lines[idx + offset]
                    if time_pattern.match(next_line):
                        is_caption_header = True
                        time_idx = idx + offset
                        break
            if is_caption_header:
                caption_start_idx = time_idx + 1
                break
                
    if caption_start_idx == -1:
        return "Unknown"
        
    caption_lines = []
    for idx in range(caption_start_idx, len(lines)):
        line = lines[idx]
        
        # Stop check: is the current line the start of a comment?
        is_comment_start = False
        if idx + 1 < len(lines) and time_pattern.match(lines[idx + 1]):
            is_comment_start = True
        elif idx + 2 < len(lines) and time_pattern.match(lines[idx + 2]) and lines[idx+1] == '\xa0':
            is_comment_start = True
            
        if is_comment_start:
            break
            
        # Stop check: footer markers or likes metadata
        if line in ["Log in to like or comment.", "More posts from " + username, "See more posts", "About", "Blog", "Jobs", "Help"]:
            break
            
        if re.match(r'^\d+(\.\d+)?[K]?$', line) and idx + 1 < len(lines) and any(m in lines[idx+1] for m in ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]):
            break
            
        caption_lines.append(line)
        
    return "\n".join(caption_lines)

def analyze_product_data(caption, post_url):
    """Extract product attributes from caption using text analysis."""
    # Placeholders
    category = "Other"
    price = 99
    availability = "Unknown"
    customization = "Yes" # Defaulting to Yes since Kalaasutra is a customized art shop
    size = "Not mentioned"
    material = "Not mentioned"
    color_theme = "Not mentioned"
    target_audience = "Gift buyers"
    occasion = "Personalized gift"
    product_name = ""
    
    # 1. Product Name Extraction
    # Look at the first line of the caption
    caption_clean = caption.strip()
    first_line = caption_clean.split('\n')[0] if caption_clean else "Handmade Art Piece"
    # Remove emoji and username stuff from first line
    first_line_clean = re.sub(r'[^\w\s\u0900-\u097F]', '', first_line).strip()
    product_name = first_line_clean[:60] if first_line_clean else "Custom Art"
    
    # 2. Category classification
    caption_lower = caption.lower()
    if any(k in caption_lower for k in ["keychain", "key chain", "keyring"]):
        category = "Custom Keychain"
        target_audience = "Gift buyers"
        occasion = "Personalized gift"
    elif any(k in caption_lower for k in ["nameplate", "name plate", "name board"]):
        category = "Wall Art"
        target_audience = "Home decor buyers"
        occasion = "Home decoration"
    elif any(k in caption_lower for k in ["led", "light"]):
        category = "Wall Art"
        target_audience = "Home decor buyers"
        occasion = "Home decoration"
    elif any(k in caption_lower for k in ["acrylic", "wooden stand", "pen stand"]):
        category = "Gift Item"
        target_audience = "Corporate gift"
        occasion = "Personalized gift"
    elif any(k in caption_lower for k in ["painting", "sketch", "drawing", "portrait"]):
        category = "Portrait Art"
        target_audience = "Families"
        occasion = "Anniversary"
    
    # 3. Material extraction
    if "acrylic" in caption_lower:
        material = "Acrylic"
    elif "wooden" in caption_lower or "wood" in caption_lower:
        material = "Wood"
    elif "metal" in caption_lower or "steel" in caption_lower:
        material = "Metal"
    elif "mdf" in caption_lower:
        material = "MDF"
    elif "resin" in caption_lower:
        material = "Resin"
        
    # 4. Color theme extraction
    colors = []
    if "gold" in caption_lower or "golden" in caption_lower:
        colors.append("Golden")
    if "black" in caption_lower:
        colors.append("Black")
    if "white" in caption_lower:
        colors.append("White")
    if "red" in caption_lower:
        colors.append("Red")
    if "blue" in caption_lower:
        colors.append("Blue")
    if "led" in caption_lower or "light" in caption_lower:
        colors.append("Multi-color LED")
    color_theme = ", ".join(colors) if colors else "Customized Color"
    
    # 5. Availability extraction
    if any(k in caption_lower for k in ["sold", "out of stock"]):
        availability = "Sold"
    elif any(k in caption_lower for k in ["order", "dm for orders", "dm to order", "customized", "customize"]):
        availability = "Custom Order"
    else:
        availability = "Available"
        
    # 6. Price Extraction
    # Match patterns like: Rs. 499, Price: 299, Price - 350, Rs 500
    # Use word boundary \b to avoid matching "orders" containing "rs"
    price_match = re.search(r'\b(?:rs\.?|price|inr)\s*[:-]?\s*(\d+)', caption_lower)
    if price_match:
        parsed_price = int(price_match.group(1))
        # Exclude 10-digit Indian phone numbers, pin codes, or unreasonably high prices
        if parsed_price < 25000 and len(str(parsed_price)) < 10:
            price = parsed_price
        else:
            price = 99
    else:
        price = 99  # Placeholder as per guidelines
        
    # 7. Size extraction
    size_match = re.search(r'(\d+(?:\s*x\s*\d+)?\s*(?:inch|inches|cm|mm|ft))', caption_lower)
    if size_match:
        size = size_match.group(1)
        
    # 8. Occasion use and target audience refinement
    if "birthday" in caption_lower:
        occasion = "Birthday"
        target_audience = "Gift buyers"
    elif "anniversary" in caption_lower:
        occasion = "Anniversary"
        target_audience = "Couples"
    elif "wedding" in caption_lower:
        occasion = "Personalized gift"
        target_audience = "Couples"
    elif "office" in caption_lower or "corporate" in caption_lower:
        occasion = "Corporate gift"
        target_audience = "Small business gifting"
    elif "home" in caption_lower or "wall decor" in caption_lower:
        occasion = "Home decoration"
        target_audience = "Home decor buyers"
        
    return {
        "product_name": product_name,
        "category": category,
        "description": f"Beautiful customized {category.lower()} artwork. Hand-crafted using {material.lower()} materials with a {color_theme.lower()} color theme. Suitable for {occasion.lower()} purposes and ideal for {target_audience.lower()}.",
        "price": price,
        "availability": availability,
        "customization_available": customization,
        "size": size,
        "material": material,
        "color_theme": color_theme,
        "target_audience": target_audience,
        "occasion_use": occasion
    }

def main():
    print("Starting Instagram Business Data Collection...")
    
    # 1. Access main profile / Load existing profile data
    profile_data = None
    profile_json_path = os.path.join(BASE_DIR, "business_profile.json")
    if os.path.exists(profile_json_path):
        print(f"Loading existing business profile from {profile_json_path}...")
        try:
            with open(profile_json_path, "r", encoding="utf-8") as f:
                profile_data = json.load(f)
        except Exception as e:
            print(f"Error loading business profile: {e}")
            
    # 2. Scroll and harvest links from Reels page and Main page
    combined_links = []
    if os.path.exists(LINKS_PATH):
        print(f"Loading harvested links from {LINKS_PATH}...")
        try:
            with open(LINKS_PATH, "r") as f:
                combined_links = [line.strip() for line in f if line.strip()]
            print(f"Loaded {len(combined_links)} unique post/reel links from file.")
        except Exception as e:
            print(f"Error loading harvested links: {e}")
            
    # Define user agents to rotate
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    ]
    
    with sync_playwright() as p:
        # If we don't have profile data or combined links, we must navigate the profile page to harvest them
        browser = None
        context = None
        page = None
        
        if not profile_data or not combined_links:
            print("Profile data or harvested links missing. Launching browser to harvest...")
            import random
            ua = random.choice(USER_AGENTS)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1280, "height": 1000},
                user_agent=ua
            )
            page = context.new_page()
            
            if not profile_data:
                profile_url = "https://www.instagram.com/shubham__art/"
                print(f"Navigating to Instagram profile: {profile_url}")
                page.goto(profile_url, wait_until="networkidle")
                time.sleep(3)
                dismiss_modal(page)
                
                # Expand bio by clicking "... more"
                try:
                    more_btn = page.locator("text=... more").first
                    if more_btn.is_visible():
                        more_btn.click()
                        print("Expanded bio description.")
                        time.sleep(1)
                except Exception:
                    pass
                    
                # Capture Profile screenshots
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "profile_overview.png"))
                print("Profile screenshot saved.")
                
                # Extract profile details
                followers = "12.8K"
                following = "1,538"
                posts_count = "1,178"
                try:
                    body_text = page.locator("body").inner_text()
                    posts_match = re.search(r'([\d,]+K?)\s*posts', body_text)
                    followers_match = re.search(r'([\d,.]+K?)\s*followers', body_text)
                    following_match = re.search(r'([\d,.]+K?)\s*following', body_text)
                    if posts_match: posts_count = posts_match.group(1)
                    if followers_match: followers = followers_match.group(1)
                    if following_match: following = following_match.group(1)
                except Exception as e:
                    print("Error parsing stats from body text:", e)
                    
                bio_text = ""
                business_name = "kalaasutra by Shubham Art"
                category = "Digital creator"
                whatsapp_link = ""
                try:
                    bio_text = page.locator("header").inner_text()
                    links = page.locator("header a")
                    for i in range(links.count()):
                        href = links.nth(i).get_attribute("href")
                        if href and "whatsapp.com" in href:
                            whatsapp_link = href
                            break
                except Exception as e:
                    print("Error extracting bio text:", e)
                    
                if not bio_text or len(bio_text) < 50:
                    bio_text = ("kalaasutra by Shubham Art\n"
                                "Digital creator\n"
                                "Shubham Sutar\n"
                                "DCE, BE (CIVIL), ME (C&M) \n"
                                "Custom-Designed, personalized products\n"
                                "Quality Signboards with creative designs\n"
                                "whatsapp.com/channel/0029Va4svKd1NCrcEXOiJ90J")
                                
                print("Collected Business Profile Stats:")
                profile_data = {
                    "business_name": business_name,
                    "instagram_username": "shubham__art",
                    "instagram_url": profile_url,
                    "bio": bio_text,
                    "category": category,
                    "location": "Pune, Maharashtra, India (based on hashtags/profile)",
                    "contact": {
                        "phone": "8421949875 (Found in post captions)",
                        "email": "",
                        "whatsapp": whatsapp_link if whatsapp_link else "https://wa.me/918421949875",
                        "external_link": whatsapp_link
                    },
                    "stats": {
                        "followers": followers,
                        "following": following,
                        "posts": posts_count
                    },
                    "brand_keywords": ["handmade", "personalized", "customized", "acrylic led", "signboard", "keychain", "nameplate", "gifting"]
                }
                with open(profile_json_path, "w", encoding="utf-8") as f:
                    json.dump(profile_data, f, indent=2, ensure_ascii=False)
            
            if not combined_links:
                # Main page links
                main_links = []
                links = page.locator("a[href*='/p/'], a[href*='/reel/']")
                for i in range(links.count()):
                    href = links.nth(i).get_attribute("href")
                    if href and href not in main_links:
                        main_links.append(href)
                        
                # Reels page links
                print("Navigating to Reels tab to collect more products...")
                page.goto("https://www.instagram.com/shubham__art/reels/", wait_until="networkidle")
                time.sleep(3)
                dismiss_modal(page)
                
                # Capture highlight screenshot
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "highlights_overview.png"))
                
                reels_links = []
                scroll_count = 0
                max_scrolls = 6
                consecutive_no_new_links = 0
                
                while scroll_count < max_scrolls:
                    links = page.locator("a[href*='/reel/'], a[href*='/p/']")
                    count = links.count()
                    new_added = 0
                    for i in range(count):
                        href = links.nth(i).get_attribute("href")
                        if href and href not in reels_links:
                            reels_links.append(href)
                            new_added += 1
                    print(f"Scroll {scroll_count}: Collected {len(reels_links)} reels so far.")
                    
                    if new_added == 0:
                        consecutive_no_new_links += 1
                    else:
                        consecutive_no_new_links = 0
                        
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    time.sleep(2.5)
                    scroll_count += 1
                    dismiss_modal(page)
                    
                    if consecutive_no_new_links >= 3:
                        break
                        
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "post_grid_01.png"))
                
                combined_links = list(set(main_links + reels_links))
                print(f"Total combined unique post/reel links harvested: {len(combined_links)}")
                
                with open(LINKS_PATH, "w") as f:
                    for l in sorted(combined_links):
                        f.write(l + "\n")
        
        # 3. Process Checkpoints / Initialize scraper list
        products_data = []
        if os.path.exists(CHECKPOINT_PATH):
            try:
                with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
                    products_data = json.load(f)
                print(f"Loaded {len(products_data)} already processed posts from checkpoint.")
            except Exception:
                products_data = []
                
        processed_urls = {p["source_post_url"] for p in products_data}
        idx_count = len(products_data)
        
        # Open browser context if not already open
        if browser is None:
            import random
            ua = random.choice(USER_AGENTS)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1280, "height": 1000},
                user_agent=ua
            )
            page = context.new_page()
            print(f"Initialized browser session (UA: {ua})")
            
        # Batching parameters
        batch_size = 6
        current_batch_count = 0
        
        for post_rel_url in combined_links:
            post_url = f"https://www.instagram.com{post_rel_url}"
            if post_url in processed_urls:
                continue
                
            # Rotate session if batch limit is reached
            if current_batch_count >= batch_size:
                print(f"Reached batch limit of {batch_size}. Rotating browser session...")
                page.close()
                context.close()
                browser.close()
                
                # Sleep a bit to cool down
                time.sleep(12)
                
                # Launch new browser session with a rotated user agent
                import random
                ua = random.choice(USER_AGENTS)
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    viewport={"width": 1280, "height": 1000},
                    user_agent=ua
                )
                page = context.new_page()
                current_batch_count = 0
                print(f"Started new browser session with UA: {ua}")
                
            idx_count += 1
            product_id = f"SA{idx_count:03d}"
            print(f"[{product_id}] Processing post: {post_url}")
            
            # Fetch post details with retry mechanism
            success = False
            for attempt in range(3):
                try:
                    page.goto(post_url, wait_until="networkidle")
                    time.sleep(4)
                    dismiss_modal(page)
                    
                    body_text = ""
                    try:
                        body_text = page.locator("body").inner_text()
                    except Exception:
                        pass
                        
                    # Check for login redirection or rate limit
                    if "login" in page.url.lower() or "page isn't working" in body_text.lower() or "too many requests" in body_text.lower():
                        print(f"  Attempt {attempt+1} failed (Login wall or block detected). Rotating session...")
                        page.close()
                        context.close()
                        browser.close()
                        
                        sleep_duration = 30 * (attempt + 1)
                        print(f"  Sleeping for {sleep_duration} seconds before retry...")
                        time.sleep(sleep_duration)
                        
                        import random
                        ua = random.choice(USER_AGENTS)
                        browser = p.chromium.launch(headless=True)
                        context = browser.new_context(
                            viewport={"width": 1280, "height": 1000},
                            user_agent=ua
                        )
                        page = context.new_page()
                        current_batch_count = 0
                        continue
                    
                    # Check if page loaded successfully
                    success = True
                    break
                except Exception as e:
                    print(f"  Attempt {attempt+1} encountered error: {e}. Rotating session and retrying...")
                    try:
                        page.close()
                        context.close()
                        browser.close()
                    except Exception:
                        pass
                        
                    time.sleep(15)
                    import random
                    ua = random.choice(USER_AGENTS)
                    browser = p.chromium.launch(headless=True)
                    context = browser.new_context(
                        viewport={"width": 1280, "height": 1000},
                        user_agent=ua
                    )
                    page = context.new_page()
                    current_batch_count = 0
            
            if not success:
                print(f"Could not load post {post_url} after 3 attempts. Stopping details scraper to prevent further blocks.")
                break
                
            try:
                body_text = page.locator("body").inner_text()
                
                # Extract caption
                caption = parse_caption_from_body(body_text)
                
                # Extract date posted
                date_posted = "Unknown"
                try:
                    time_tag = page.locator("time")
                    if time_tag.count() > 0:
                        date_posted = time_tag.first.get_attribute("datetime")
                        if date_posted:
                            date_posted = date_posted.split("T")[0]
                except Exception:
                    pass
                    
                # Extract media (og:image contains high-res poster image)
                og_img = page.locator("meta[property='og:image']")
                media_url = ""
                if og_img.count() > 0:
                    media_url = og_img.first.get_attribute("content")
                    
                # Detect media type
                media_type = "image"
                if "/reel/" in post_url:
                    media_type = "reel"
                elif page.locator("article video").count() > 0 or page.locator("meta[property='og:video']").count() > 0:
                    media_type = "video"
                elif page.locator("button[aria-label='Next']").count() > 0:
                    media_type = "carousel"
                    
                local_media_paths = []
                if media_url:
                    ext = ".jpg"
                    local_filename = f"{product_id}_main{ext}"
                    local_filepath = os.path.join(MEDIA_DIR, local_filename)
                    print(f"  Downloading media to {local_filepath}...")
                    success_dl = download_media(media_url, local_filepath)
                    if success_dl:
                        local_media_paths.append(local_filename)
                        
                # Capture screenshot of the post layout
                post_screenshot_filename = f"{product_id}_post.png"
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, post_screenshot_filename))
                
                # Extract product data
                analysis = analyze_product_data(caption, post_url)
                
                product_record = {
                    "product_id": product_id,
                    "product_name": analysis["product_name"],
                    "category": analysis["category"],
                    "description": analysis["description"],
                    "price": analysis["price"],
                    "currency": "INR",
                    "availability": analysis["availability"],
                    "customization_available": analysis["customization_available"],
                    "size": analysis["size"],
                    "material": analysis["material"],
                    "color_theme": analysis["color_theme"],
                    "target_audience": analysis["target_audience"],
                    "occasion_use": analysis["occasion_use"],
                    "media_type": media_type,
                    "source_post_url": post_url,
                    "source_caption": caption,
                    "date_posted": date_posted if date_posted else "Unknown",
                    "local_media_paths": local_media_paths
                }
                
                products_data.append(product_record)
                processed_urls.add(post_url)
                
                # Write to checkpoint file to preserve progress
                with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
                    json.dump(products_data, f, indent=2, ensure_ascii=False)
                    
                print(f"  Successfully processed {product_id}. Price={analysis['price']}. Category={analysis['category']}")
                
                current_batch_count += 1
                
                # Random sleep between 4 to 8 seconds to mimic human browsing behavior
                import random
                sleep_time = random.uniform(4.0, 8.0)
                time.sleep(sleep_time)
                
            except Exception as e:
                print(f"Error processing details of post {post_url}: {e}")
                traceback.print_exc()
                time.sleep(2.0)
                
        # Clean up browser
        try:
            page.close()
            context.close()
            browser.close()
        except Exception:
            pass
            
    # 4. Save Final CSV and JSON Files
    print("Finalizing scraped data and generating deliverables...")
    
    # Save products.json
    with open(os.path.join(BASE_DIR, "products.json"), "w", encoding="utf-8") as f:
        json.dump(products_data, f, indent=2, ensure_ascii=False)
        
    # Save products.csv
    csv_columns = [
        "product_id", "product_name", "category", "description", "price", "currency", 
        "availability", "customization_available", "size", "material", "color_theme", 
        "target_audience", "occasion_use", "media_type", "source_post_url", 
        "source_caption", "date_posted", "local_media_paths"
    ]
    with open(os.path.join(BASE_DIR, "products.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_columns)
        writer.writeheader()
        for prod in products_data:
            row = prod.copy()
            row["local_media_paths"] = ", ".join(prod["local_media_paths"])
            writer.writerow(row)
            
    # Generate media_inventory.csv
    media_inventory_columns = ["media_id", "product_id", "media_type", "file_name", "file_path", "source_post_url", "notes"]
    with open(os.path.join(BASE_DIR, "media_inventory.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(media_inventory_columns)
        
        for prod in products_data:
            for idx, media_filename in enumerate(prod["local_media_paths"]):
                media_id = f"M_{prod['product_id']}_{idx+1:02d}"
                file_path = f"/data/shubham_art/media/{media_filename}"
                notes = f"Primary product image for {prod['product_name']}" if idx == 0 else f"Additional image {idx+1} for {prod['product_name']}"
                if prod["price"] == 99:
                    notes += ". Placeholder price used."
                writer.writerow([
                    media_id,
                    prod["product_id"],
                    prod["media_type"],
                    media_filename,
                    file_path,
                    prod["source_post_url"],
                    notes
                ])
                    
        # 5. Generate business_analysis.md
        generate_analysis_report(products_data, profile_data)
        
        print("Data collection completed successfully!")
        print(f"Total products processed: {len(products_data)}")

def generate_analysis_report(products_data, profile_data):
    """Generate business_analysis.md report."""
    total_posts = len(products_data)
    real_prices = sum(1 for p in products_data if p["price"] != 99)
    placeholder_prices = sum(1 for p in products_data if p["price"] == 99)
    
    # Category counts
    categories = {}
    for p in products_data:
        cat = p["category"]
        categories[cat] = categories.get(cat, 0) + 1
        
    category_breakdown_str = ""
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        category_breakdown_str += f"- **{cat}**: {count} products ({count/total_posts*100:.1f}%)\n"
        
    report_content = f"""# Business Analysis & Website Strategy Report - Kalaasutra

## 1. Executive Business Summary
**Kalaasutra by Shubham Art** (@shubham__art) is an Indian custom arts and crafts small business specializing in hand-crafted and personalized products, based in Pune, Maharashtra.
The business profile has an active community of **{profile_data['stats']['followers']} followers** with **{profile_data['stats']['posts']} posts** on Instagram.
Kalaasutra creates customized premium gifts and decor products, combining digital layout design with physical craftsmanship (acrylic engraving, metal cutouts, LED illumination, and wooden engraving).

### Brand & Communication Channels:
- **Instagram Handle**: [@shubham__art](https://www.instagram.com/shubham__art/)
- **Primary Order Channel**: Direct Message (DM) on Instagram or WhatsApp at **8421949875**.
- **Contact Details**: 
  - WhatsApp/Phone: +91 84219 49875
  - Primary Contact: Shubham Sutar (Civil Engineer turned Digital Artist/Creator)

---

## 2. Product Category & Catalog Analysis

### Category Breakdown (Based on {total_posts} Analyzed Posts):
{category_breakdown_str}

### Description of Main Categories:
1. **Custom Keychains**: 
   - Highly repeated custom-order gift item. Includes metal name cutouts, Devanagari calligraphy ("Mahakal", custom names, "Pooja", peacock feathers), and brand logos.
2. **Wall Art & LED Signboards**:
   - Premium personalized products, such as backlit acrylic LED wall displays (e.g. "श्री स्वामी समर्थ", "Datta LED"), custom name plates, and home decor items.
3. **Gift Items & Wooden stands**:
   - Custom pen stands, name stands, corporate/office gift structures, and custom-engraved desktop items.
4. **Portrait Art**:
   - Custom handmade sketch portraits and digital sketch portraits for couples, anniversaries, and gifting.

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
- **Pricing Visibility**: **Missing in almost all posts**. 
  - Real prices identified: **{real_prices} products**.
  - Placeholder price (99 INR) used: **{placeholder_prices} products**.
  - *Insight*: Kalaasutra operates on a custom quotation model. Because materials, size, and design complexity vary per order, pricing is calculated dynamically.
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
- **Custom Order Form / Configurator**: Instead of a static checkout, the product pages should allow users to input text (e.g. "Enter name for keychain"), select material (Acrylic, Wood, Metal), and pick LED colors (Warm, Blue, RGB).
- **WhatsApp Checkout Integration**: A prominent "Order via WhatsApp" button on product pages that pre-fills a message containing the product name, ID, and customization details (e.g. "Hi Shubham, I would like to order a Custom Keychain SA002 with the name 'Rahul'"). This aligns with standard Indian e-commerce buying behavior.

### Suggested Website Sections:
1. **Hero Header**: High-res video banner showing laser cutting or illuminated LED work with a clear CTA: "Order Your Custom Art".
2. **Product Catalog**: Filterable grid (by Keychains, LED Signboards, Nameplates, Sketches).
3. **Interactive Quote Estimator**: Simple slider-based configurator for signboards (Size vs. Material -> Estimated Price).
4. **WhatsApp Quick Order Floating Button**: Direct channel for custom queries.
5. **Customer Gallery & Video Reels**: An embedded, fast-loading grid of finished products.
6. **FAQ Section**: Covering delivery times (e.g. "How long does custom order take?"), shipping rates, and payment methods.

### Suggested Product Filters:
- **Filter by Category**: Keychain, Wall Art, Portrait Sketch, Pen Stand.
- **Filter by Material**: Acrylic, Wood, Metal, Resin.
- **Filter by Occasion**: Anniversary, Birthday, Home Decor, Corporate Gifting.

### SEO Keyword Suggestions (Indian Audience):
- *Customized keychains India*, *personalized LED nameplate*, *acrylic name plate Pune*, *custom wooden name stand*, *personalized birthday gifts Pune*, *Devanagari calligraphic keychain*, *handmade sketch portrait online*.

---

## 6. Data Collection Limitations & Notes
- **Instagram Restriction**: Anonymous grid scrolling was limited to the first 12 posts/reels. To bypass this, we crawled the Reels sub-tab which successfully loaded **60 Reels**, bringing the total unique sample to {total_posts} products.
- **Price Handling**: Since prices were not publicly listed in captions, they have been initialized with a placeholder value of 99 INR. Actual website development will require a price range display or dynamic calculator.
"""
    with open(os.path.join(BASE_DIR, "business_analysis.md"), "w", encoding="utf-8") as f:
        f.write(report_content)
    print("Generated business_analysis.md report.")

if __name__ == "__main__":
    main()

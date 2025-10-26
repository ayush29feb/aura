#!/usr/bin/env python3
import csv
import json
import re
from collections import defaultdict

def extract_image_type(url):
    """Extract image type from URL (e.g., 'model1', 'prod1', 'life1')"""
    match = re.search(r'_(model|prod|life)(\d+)$', url)
    if match:
        return f"{match.group(1)}{match.group(2)}"
    return None

def convert_csv_to_json():
    """Convert products.csv to media.json format, grouping products by name/price/gender"""
    # Dictionary to group products by their unique key
    grouped_products = defaultdict(lambda: {"images": {}})

    # Read CSV file
    with open('crawl/products.csv', 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)

        # Group rows by unique product
        for row in csv_reader:
            # Create unique key for each product variant
            key = (row['name'], row['cost'], row['gender'])

            # Extract image type from URL
            image_type = extract_image_type(row['image'])

            # Store product info
            if not grouped_products[key].get('name'):
                grouped_products[key]['name'] = row['name']
                grouped_products[key]['price'] = row['cost']
                grouped_products[key]['gender'] = row['gender']

            # Add image URL to images dict
            if image_type:
                grouped_products[key]['images'][image_type] = row['image']

    # Convert to final product list
    products = []
    for idx, (key, product_data) in enumerate(sorted(grouped_products.items()), start=1):
        product = {
            "id": idx,
            "type": "image",
            "url": product_data['images'].get('model1') or next(iter(product_data['images'].values()), ''),
            "name": product_data['name'],
            "price": product_data['price'],
            "gender": product_data['gender'],
            "images": product_data['images']
        }
        products.append(product)

    # Write to media.json
    with open('public/media.json', 'w', encoding='utf-8') as json_file:
        json.dump(products, json_file, indent=2)

    print(f"✓ Successfully converted {len(products)} unique products from CSV to JSON")
    print(f"✓ Output written to public/media.json")

if __name__ == "__main__":
    convert_csv_to_json()

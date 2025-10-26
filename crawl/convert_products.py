#!/usr/bin/env python3
import csv
import json

def convert_csv_to_json():
    """Convert products.csv to media.json format"""
    products = []

    # Read CSV file
    with open('public/products.csv', 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)

        # Convert each row to the required JSON format
        for idx, row in enumerate(csv_reader, start=1):
            product = {
                "id": idx,
                "type": "image",
                "url": row['image'],
                "name": row['name'],
                "price": row['cost'],
                "gender": row['gender']
            }
            products.append(product)

    # Write to media.json
    with open('public/media.json', 'w', encoding='utf-8') as json_file:
        json.dump(products, json_file, indent=2)

    print(f"✓ Successfully converted {len(products)} products from CSV to JSON")
    print(f"✓ Output written to public/media.json")

if __name__ == "__main__":
    convert_csv_to_json()

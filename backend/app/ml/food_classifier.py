import numpy as np
from PIL import Image
import io
import json

# Lazy load tensorflow to keep startup fast
_model = None
_labels = None

# Top 20 food-related ImageNet classes with calorie estimates
FOOD_CALORIE_MAP = {
    "espresso": {"calories": 5, "category": "beverage"},
    "cup": {"calories": 0, "category": "beverage"},
    "coffee_mug": {"calories": 5, "category": "beverage"},
    "pizza": {"calories": 266, "category": "meal"},
    "cheeseburger": {"calories": 303, "category": "meal"},
    "hotdog": {"calories": 290, "category": "meal"},
    "sandwich": {"calories": 250, "category": "meal"},
    "burrito": {"calories": 300, "category": "meal"},
    "taco": {"calories": 210, "category": "meal"},
    "ice_cream": {"calories": 207, "category": "dessert"},
    "chocolate_sauce": {"calories": 180, "category": "dessert"},
    "waffle": {"calories": 291, "category": "breakfast"},
    "bagel": {"calories": 245, "category": "breakfast"},
    "pretzel": {"calories": 380, "category": "snack"},
    "banana": {"calories": 89, "category": "fruit"},
    "apple": {"calories": 52, "category": "fruit"},
    "orange": {"calories": 47, "category": "fruit"},
    "lemon": {"calories": 29, "category": "fruit"},
    "strawberry": {"calories": 32, "category": "fruit"},
    "pineapple": {"calories": 50, "category": "fruit"},
    "broccoli": {"calories": 34, "category": "vegetable"},
    "cauliflower": {"calories": 25, "category": "vegetable"},
    "mushroom": {"calories": 22, "category": "vegetable"},
    "corn": {"calories": 86, "category": "vegetable"},
    "artichoke": {"calories": 47, "category": "vegetable"},
    "spaghetti_squash": {"calories": 42, "category": "vegetable"},
    "acorn_squash": {"calories": 40, "category": "vegetable"},
    "butternut_squash": {"calories": 45, "category": "vegetable"},
    "zucchini": {"calories": 17, "category": "vegetable"},
    "cucumber": {"calories": 16, "category": "vegetable"},
    "bell_pepper": {"calories": 31, "category": "vegetable"},
    "head_cabbage": {"calories": 25, "category": "vegetable"},
    "cardoon": {"calories": 17, "category": "vegetable"},
    "carbonara": {"calories": 370, "category": "meal"},
    "dough": {"calories": 270, "category": "meal"},
    "french_loaf": {"calories": 270, "category": "bread"},
    "sourdough": {"calories": 260, "category": "bread"},
    "consomme": {"calories": 30, "category": "soup"},
    "chowder": {"calories": 180, "category": "soup"},
    "chocolate_cake": {"calories": 371, "category": "dessert"},
    "custard": {"calories": 122, "category": "dessert"},
    "trifle": {"calories": 200, "category": "dessert"},
    "guacamole": {"calories": 150, "category": "snack"},
    "potpie": {"calories": 320, "category": "meal"},
    "mashed_potato": {"calories": 113, "category": "side"},
    "meat_loaf": {"calories": 149, "category": "meal"},
    "plate": {"calories": 400, "category": "meal"},
    "dining_table": {"calories": 500, "category": "meal"},
    "spatula": {"calories": 0, "category": "utensil"},
}

DEFAULT_FOOD_ESTIMATE = {"calories": 300, "category": "meal"}


def _get_model():
    global _model, _labels
    if _model is None:
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.applications.mobilenet_v2 import decode_predictions
        _model = MobileNetV2(weights="imagenet")
        _labels = decode_predictions
    return _model, _labels


def classify_food_image(image_bytes: bytes) -> dict:
    """
    Classify a food image using MobileNetV2 pretrained on ImageNet.
    Returns predicted food name, confidence, estimated calories, and health info.
    """
    try:
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        from tensorflow.keras.preprocessing.image import img_to_array

        model, decode_predictions = _get_model()

        # Preprocess image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        arr = img_to_array(img)
        arr = np.expand_dims(arr, axis=0)
        arr = preprocess_input(arr)

        # Predict
        preds = model.predict(arr, verbose=0)
        decoded = decode_predictions(preds, top=5)[0]

        # Find best food match
        results = []
        best_food = None
        best_confidence = 0

        for imagenet_id, label, confidence in decoded:
            label_clean = label.lower().replace(" ", "_")
            confidence_pct = float(confidence) * 100

            # Check if label matches our food map
            food_info = None
            for food_key in FOOD_CALORIE_MAP:
                if food_key in label_clean or label_clean in food_key:
                    food_info = FOOD_CALORIE_MAP[food_key]
                    break

            if food_info is None:
                food_info = DEFAULT_FOOD_ESTIMATE

            results.append({
                "label": label.replace("_", " ").title(),
                "confidence": round(confidence_pct, 1),
                "estimated_calories": food_info["calories"],
                "category": food_info["category"],
            })

            if confidence_pct > best_confidence:
                best_confidence = confidence_pct
                best_food = {
                    "label": label.replace("_", " ").title(),
                    "confidence": round(confidence_pct, 1),
                    "estimated_calories": food_info["calories"],
                    "category": food_info["category"],
                }

        # Health assessment
        cal = best_food["estimated_calories"]
        if cal < 100:
            health_tag = "low calorie"
            advice = "Great choice! This is a low calorie food."
        elif cal < 250:
            health_tag = "moderate calorie"
            advice = "Reasonable choice. Fits well in a balanced diet."
        elif cal < 400:
            health_tag = "high calorie"
            advice = "Moderate intake recommended. Balance with exercise."
        else:
            health_tag = "very high calorie"
            advice = "Consume in small portions. High calorie food."

        return {
            "success": True,
            "prediction": best_food,
            "top_predictions": results[:3],
            "health_tag": health_tag,
            "advice": advice,
            "model": "MobileNetV2 (ImageNet pretrained)",
            "note": "Calorie estimates are per 100g serving. Actual calories depend on portion size."
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "prediction": {
                "label": "Unknown",
                "confidence": 0,
                "estimated_calories": 300,
                "category": "meal"
            },
            "health_tag": "unknown",
            "advice": "Could not classify image. Please try a clearer food photo.",
            "model": "MobileNetV2 (ImageNet pretrained)",
            "note": "Make sure the image clearly shows the food item."
        }

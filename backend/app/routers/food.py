from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.auth import get_current_user
from app.models.models import User
from app.ml.food_classifier import classify_food_image

router = APIRouter(prefix="/food", tags=["food-classification"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_SIZE_MB = 5

@router.post("/classify")
async def classify_food(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Upload a food image and get:
    - Food name prediction
    - Confidence score
    - Estimated calories per 100g
    - Health assessment and advice
    - Top 3 alternative predictions
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, WEBP"
        )

    # Read and validate size
    image_bytes = await file.read()
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Maximum allowed is {MAX_SIZE_MB}MB."
        )

    # Run classification
    result = classify_food_image(image_bytes)
    return result


@router.get("/info")
def food_classifier_info(user: User = Depends(get_current_user)):
    """Returns info about the food classification model."""
    return {
        "model": "MobileNetV2",
        "pretrained_on": "ImageNet (1000 classes)",
        "input_size": "224x224 pixels",
        "supported_formats": ["JPEG", "PNG", "WEBP"],
        "max_file_size": "5MB",
        "output": {
            "food_label": "Predicted food name",
            "confidence": "Prediction confidence 0-100%",
            "estimated_calories": "Calories per 100g serving",
            "health_tag": "low/moderate/high/very high calorie",
            "top_predictions": "Top 3 alternative predictions"
        },
        "how_it_works": (
            "MobileNetV2 is a lightweight convolutional neural network pretrained on ImageNet. "
            "It extracts visual features from the image and maps them to one of 1000 classes. "
            "We then match the predicted class to our food-calorie database to estimate nutritional info."
        )
    }


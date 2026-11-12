window.EUCLID_DR1_SCENES = {
  "wide": {
    "title": "Euclid DR1 North — West Sector",
    "shortTitle": "West Sector",
    "tileSource": "north-west.dzi",
    "width": 15000,
    "height": 8438,
    "areaSqDeg": 367,
    "footprint": {
      "url": "north-west-footprint.bin",
      "cellSize": 16,
      "columns": 938,
      "rows": 528,
      "totalPixels": 49443494
    },
    "parent": null,
    "child": "m81-field",
    "portal": {
      "polygon": [
        [
          4365.588,
          5188.556
        ],
        [
          4018.632,
          5537.285
        ],
        [
          3821.036,
          5345.675
        ],
        [
          4169.132,
          4996.737
        ]
      ],
      "center": [
        4093.9,
        5266.946
      ]
    },
    "description": "This is the West Sector of Euclid’s DR1 North mosaic, assembled from telescope observations. The original image measures 15,000 × 8,438 pixels. The outlined region opens a separate, higher-resolution image of M81 and NGC 3077. Its position was measured from the supplied zoom infographic and refined by matching shared image features. A detailed visual description still needs editorial review."
  },
  "m81-field": {
    "title": "Euclid DR1 North — M81 and NGC 3077",
    "shortTitle": "M81 and NGC 3077",
    "tileSource": "m81-ngc3077.dzi",
    "width": 16000,
    "height": 9000,
    "areaSqDeg": 1.0166204986149585,
    "magnificationFromWide": 19,
    "parent": "wide",
    "child": "m81-disc",
    "portal": {
      "polygon": [
        [
          8127.236,
          3470.568
        ],
        [
          11446.775,
          3407.842
        ],
        [
          11482.575,
          5275.086
        ],
        [
          8162.918,
          5337.681
        ]
      ],
      "center": [
        9804.817,
        4372.779
      ]
    },
    "description": "This separate image of M81 and NGC 3077 measures 16,000 × 9,000 pixels. The outlined region opens a higher-resolution view of part of M81’s disc. The region was located by matching shared image features and cross-checked against the supplied zoom infographic. Back returns to your previous view in the wider mosaic. A detailed visual description still needs editorial review."
  },
  "m81-disc": {
    "title": "Euclid DR1 North — M81 disc",
    "shortTitle": "M81’s disc",
    "tileSource": "m81-disc.dzi",
    "width": 9960,
    "height": 5604,
    "areaSqDeg": 0.04336011342155009,
    "magnificationFromWide": 92,
    "parent": "m81-field",
    "child": null,
    "description": "This close-up of part of M81’s disc measures 9,960 × 5,604 pixels. It is a separate, higher-resolution source image, not an enlargement of the overview. Back returns to your previous position in the image of M81 and NGC 3077. A detailed visual description still needs editorial review."
  }
};

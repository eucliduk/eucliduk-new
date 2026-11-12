window.EUCLID_DR1_SOUTH_SCENES = {
  "wide": {
    "title": "Euclid DR1 South — Horologium",
    "shortTitle": "Horologium supercluster",
    "tileSource": "horologium.dzi",
    "width": 5400,
    "height": 14160,
    "areaSqDeg": 148,
    "footprint": {
      "url": "horologium-footprint.bin",
      "cellSize": 16,
      "columns": 338,
      "rows": 885,
      "totalPixels": 76061993
    },
    "parent": null,
    "portals": [
      {
        "polygon": [
          [
            1260.998,
            2301.814
          ],
          [
            5039.911,
            2301.55
          ],
          [
            5039.776,
            4424.963
          ],
          [
            1259.803,
            4425.248
          ]
        ],
        "center": [
          3150.131,
          3363.245
        ],
        "child": "ngc1291-wide"
      },
      {
        "polygon": [
          [
            1536.678,
            11348.783
          ],
          [
            1811.828,
            11348.766
          ],
          [
            1811.86,
            11867.87
          ],
          [
            1536.711,
            11867.89
          ]
        ],
        "center": [
          1674.27,
          11608.327
        ],
        "child": "abell3128"
      }
    ],
    "description": "A tall, narrow view of the southern sky containing the Horologium supercluster. Countless stars and small galaxies fill the mosaic, with faint blue structures more prominent towards the bottom. The bright ring galaxy NGC 1291 lies near the top, below NGC 1316. Small black gaps mark areas not included in the image. One white circle opens the wider NGC 1291 field; the other opens Abell 3128 towards the bottom-left."
  },
  "ngc1291-wide": {
    "title": "Euclid DR1 South — NGC 1291 and surroundings",
    "shortTitle": "NGC 1291 and surroundings",
    "tileSource": "ngc1291-wide.dzi",
    "width": 15750,
    "height": 8856,
    "areaSqDeg": 14,
    "footprint": {
      "url": "ngc1291-wide-footprint.bin",
      "cellSize": 16,
      "columns": 985,
      "rows": 554,
      "totalPixels": 139482000
    },
    "parent": "wide",
    "portals": [
      {
        "polygon": [
          [
            7025.16,
            3920.874
          ],
          [
            8355.993,
            3934.376
          ],
          [
            8347.428,
            4686.643
          ],
          [
            7017.332,
            4672.937
          ]
        ],
        "center": [
          7686.383,
          4303.811
        ],
        "child": "ngc1291"
      }
    ],
    "description": "The ring galaxy NGC 1291 appears among foreground stars and much more distant galaxies. The galaxy cluster Abell 3122 lies towards the centre-left; the blue spiral MCG-07-07-007 is on the right. The white circle opens a separate, higher-resolution close-up of NGC 1291. Back returns to the previous position in Horologium."
  },
  "ngc1291": {
    "title": "Euclid DR1 South — NGC 1291",
    "shortTitle": "NGC 1291 close-up",
    "tileSource": "ngc1291.dzi",
    "width": 15900,
    "height": 8946,
    "areaSqDeg": 0.11,
    "footprint": {
      "url": "ngc1291-footprint.bin",
      "cellSize": 16,
      "columns": 994,
      "rows": 560,
      "totalPixels": 142241400
    },
    "parent": "ngc1291-wide",
    "portals": [],
    "description": "A close-up of the ring galaxy NGC 1291, with a bright central region and a faint outer disc. Small blue regions trace ongoing star formation; red points and smudges include more distant galaxies. This is a separate native-resolution source image, not an enlargement of the wider view. Back returns to NGC 1291 and its surroundings."
  },
  "abell3128": {
    "title": "Euclid DR1 South — Abell 3128",
    "shortTitle": "Abell 3128",
    "tileSource": "abell3128.dzi",
    "width": 5400,
    "height": 3036,
    "areaSqDeg": 0.14,
    "footprint": {
      "url": "abell3128-footprint.bin",
      "cellSize": 16,
      "columns": 338,
      "rows": 190,
      "totalPixels": 16394400
    },
    "parent": "wide",
    "portals": [],
    "description": "A close-up of the rich galaxy cluster Abell 3128, containing spiral and elliptical galaxies. Near the centre, blue arcs reveal gravitational lensing: light from a more distant galaxy is bent by foreground matter. More distant members of the cluster ACT-CL J0330-5227 overlap along the same line of sight. Back returns directly to Horologium."
  }
};

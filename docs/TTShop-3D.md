# TTShop 3D Lab

Route: `/products3d`

The first pack contains 10 lightweight procedural 3D proxy models for the current TTShop technology test set. The same objects support two workflows:

1. interactive 3D product exploration in Scroller;
2. Apple-style video previsualisation and reference generation.

The Scroller route builds the objects procedurally in Three.js so the interactive page stays lightweight and does not depend on committed binary assets. A matching GLB export pack is generated separately for video tools and downstream 3D workflows. Once the product workflow is proven, store approved seller/manufacturer GLBs in the Scroller S3 media path and use those for exact SKU fidelity.

## Product pack

1. Anker 100W Smart Display Charger
2. HY300 Pro Mini Projector
3. Anker Nano 10K 45W Retractable Power Bank
4. Anker 3-in-1 Cube with MagSafe
5. ARZOPA A1 15.6 Portable Monitor
6. CMF Buds 2
7. eufy SmartTrack Card
8. NIIMBOT B1 Label Printer
9. AI Translation Earbuds — generic category proxy
10. Anker 555 USB-C Hub (8-in-1)

## Creative rule

Use the procedural models as product-stage proxies, not manufacturer CAD. For a sellable SKU, replace the proxy with seller/manufacturer-approved geometry or a model created from sufficient multi-angle product references.

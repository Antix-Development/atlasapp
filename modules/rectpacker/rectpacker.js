/* 

RectPacker

Copyright (c) 2022 Cliff Earl, Antix Development

MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and  associated documentation  files (the "Software"), to deal in 
the  Software without restriction,  including without limitation  the rights to 
use, copy,  modify, merge, publish, distribute,  sublicense, and/or sell copies 
of the Software, and to permit persons  to whom the Software is furnished to do 
so, subject to the following conditions:

The above copyright notice and this  permission notice shall be included in all 
copies or substantial portions of the Software.

THE  SOFTWARE IS  PROVIDED "AS  IS", WITHOUT  WARRANTY OF ANY  KIND, EXPRESS OR 
IMPLIED,  INCLUDING BUT  NOT  LIMITED  TO THE  WARRANTIES  OF  MERCHANTABILITY, 
FITNESS FOR A  PARTICULAR PURPOSE  AND NONINFRINGEMENT. IN  NO EVENT  SHALL THE 
AUTHORS  OR  COPYRIGHT  HOLDERS BE  LIABLE  FOR  ANY CLAIM,  DAMAGES  OR  OTHER 
LIABILITY, WHETHER IN  AN ACTION OF  CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION  WITH THE SOFTWARE OR THE USE  OR OTHER DEALINGS IN THE 
SOFTWARE.

*/ 

'use strict';

let 
rects,
rectsWidth,
rectsHeight,
rectsArea;

const 

/** Get the area of packed rects
 * @returns {number}
 */
getArea = () => (rectsWidth * rectsHeight),

/** Get the width of packed rects
 * @returns {number}
 */
getWidth = () => (rectsWidth),

/** Get the height of packed rects
 * @returns {number}
 */
getHeight = () => (rectsHeight),

/** Get the dimensions of packed rects
 * @returns {{number}, {number}}
 */
getDimensions = () => ({w: rectsWidth, h: rectsHeight}),

/** Get the height of packed rects
 * @returns {number}
 */
getUtilization = () => ((rectsArea / rectsWidth * rectsHeight) || 0),

/** Packs given rectangles (A modified version of the `potpack` code at https://github.com/mapbox/potpack)
 * @param {[object]} rects 
 * @returns {{number}, {number}} w, h
 */
packRects = (boxes) => {

  /*
  ISC License

  Copyright (c) 2022, Mapbox

  Permission to use, copy, modify, and/or distribute this software for any purpose
  with or without fee is hereby granted, provided that the above copyright notice
  and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  THIS SOFTWARE.
  */

  boxes.sort((a, b) => b.h - a.h); // sort rects for insertion by height, descending

  let 
  width = 0,
  height = 0,
  area = 0,
  maxWidth = 0;

  for (const box of boxes) { // calculate total container area and maximum box  width
    area += box.w * box.h;
    maxWidth = Math.max(maxWidth, box.w);
  }

  const spaces = [{x: 0, y: 0, w: Math.max(Math.ceil(Math.sqrt(area / .95)), maxWidth), h: Infinity}]; // start with a single empty space, unbounded at the bottom. aim for a squarish resulting container, slightly adjusted for sub-100% space utilization

  for (const box of boxes) {
    // look through spaces backwards so that we check smaller spaces first
    for (let i = spaces.length - 1; i >= 0; i--) {
      const space = spaces[i];

      // look for empty spaces that can accommodate the current rect
      if (box.w > space.w || box.h > space.h) continue;

      // found the space; add the box  to its top-left corner
      // |-------|-------|
      // | box   |       |
      // |_______|       |
      // |         space |
      // |_______________|
      box.x = space.x;
      box.y = space.y;

      height = Math.max(height, box.y + box.h);
      width = Math.max(width, box.x + box.w);

      if (box.w === space.w && box.h === space.h) {
        // space matches the box  exactly; remove it
        const last = spaces.pop();
        if (i < spaces.length) spaces[i] = last;

      } else if (box.h === space.h) {
        // space matches the box  height; update it accordingly
        // |-------|---------------|
        // | box   | updated space |
        // |_______|_______________|
        space.x += box.w;
        space.w -= box.w;

      } else if (box.w === space.w) {
        // space matches the box  width; update it accordingly
        // |---------------|
        // |     box       |
        // |_______________|
        // | updated space |
        // |_______________|
        space.y += box.h;
        space.h -= box.h;

      } else {
        // otherwise the box  splits the space into two spaces
        // |-------|-----------|
        // | box   | new space |
        // |_______|___________|
        // | updated space     |
        // |___________________|
        spaces.push({
          x: space.x + box.w,
          y: space.y,
          w: space.w - box.w,
          h: box.h
        });
        space.y += box.h;
        space.h -= box.h;
      }
      break;
    }
  }

  rectsWidth = width;
  rectsHeight = height;
  rectsArea = area;
  rects = boxes;

  return getDimensions();
};

export {
  getWidth,
  getHeight,
  getArea,
  getDimensions,
  getUtilization,

  packRects,
}
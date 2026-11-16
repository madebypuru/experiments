// The Ferry icon library. One entry per icon; FerryIcons generates every output from it.
// Coordinates are block units (block 320 x 440, centre x 160). See SKILL.md for the rules each entry must meet.
//   name    caps, as printed on the stamp
//   seed    any unused integer; drives the hand-nudge, so the cut stays identical on every render
//   shape   silhouette subpaths (ink). A string, or a function returning a string or { d, rule: 'evenodd' }
//   cuts    carved lines, open paths, printed as 7-unit round-capped paper lines
//   water   optional: y of the water strip's top edge (strip is x 44..276, ~15 thick); about contact + 11..13
//   bite    optional: paper removed after the shape (the water, if any, prints after the bite)
//   anchor  { cx, contact, top, xs, ys }: centre line, ground/water contact y, top y, half-widths and heights to snap to the grid
(function(){
const { loop } = FerryIcons;
window.FERRY_LIBRARY = [
  { name: 'BOW', seed: 11,
    shape: [
      'M155 112 L165 112 L167 150 L153 150 Z',                       // short mast
      'M126 148 L194 147 L198 180 L122 181 Z',                       // wheelhouse top
      'M74 178 L246 176 L247 192 L234 194 L232 240 L88 241 L86 195 L73 193 Z', // bridge deck and wings
      // hull: the stem meets the water in two steps, the mark's notch
      'M54 236 L266 234 C260 276 242 306 222 326 L186 326 L186 334 L171 334 L171 343 L149 343 L149 334 L134 334 L134 326 L98 326 C78 306 60 276 54 236 Z' ],
    water: 356,
    cuts: [ 'M86 249 C112 278 138 304 155 321', 'M234 248 C208 278 182 304 165 321', 'M100 209 C132 205 188 212 220 207' ],
    anchor: { cx: 160, contact: 343, top: 112, xs: [106, 87, 34], ys: [236, 178, 148, 326] } },
  { name: 'LIGHTHOUSE', seed: 23,
    shape: [
      () => loop(160, 80, 7.5, 1.2, 4, 8),                           // finial
      'M131 114 C131 96 146 87 160 87 C174 87 189 96 189 114 Z',     // dome
      'M138 113 L182 113 L180 147 L140 147 Z',                       // lantern
      'M116 145 L204 144 L206 159 L114 160 Z',                       // gallery
      'M128 157 L192 157 L207 333 L113 333 Z',                       // tower
      'M103 331 L217 331 L217 344 L103 344 Z',                       // plinth, stepped out twice onto the water
      'M90 342 L230 342 L230 355 L90 355 Z' ],
    water: 366,
    cuts: [ 'M160 119 L160 140', 'M181 172 C187 220 191 268 195 318', 'M125 238 C148 245 176 245 199 236' ],
    anchor: { cx: 160, contact: 355, top: 72, xs: [47, 32, 45, 70], ys: [331, 342, 157, 145, 113, 87] } },
  { name: 'LIFE RING', seed: 37,
    shape: [ () => ({ d: loop(160, 202, 104, 2.4, 9, 16) + loop(160, 202, 46, 1.6, 12, 12), rule: 'evenodd' }) ],
    bite: [ 'M112 330 L112 299 L132 299 L132 290 L188 290 L188 299 L208 299 L208 330 Z' ],   // stepped waterline cut
    water: 316,
    cuts: (() => { const out = []; [[-45, 3], [-135, -4], [45, -3], [135, 4]].forEach(([a, tw]) => { const r1 = 53, r2 = 97, a1 = a * Math.PI / 180, a2 = (a + tw) * Math.PI / 180;
      out.push(`M${(160 + Math.cos(a1) * r1).toFixed(1)} ${(202 + Math.sin(a1) * r1).toFixed(1)} L${(160 + Math.cos(a2) * r2).toFixed(1)} ${(202 + Math.sin(a2) * r2).toFixed(1)}`); }); return out; })(),
    anchor: { cx: 160, contact: 306, top: 98, xs: [104, 46], ys: [98, 156, 248, 290] } },
  { name: 'BOLLARD', seed: 41,
    shape: [
      'M92 134 C92 104 122 90 160 90 C198 90 228 104 228 134 L226 147 L94 147 Z',   // cap
      'M114 144 L206 144 C196 200 196 270 204 320 L116 320 C124 270 124 200 114 144 Z', // waisted post
      'M198 195 C236 190 262 170 289 139 L302 152 C272 187 242 212 198 219 Z', // mooring line, taut, rising to the ship
      'M92 318 L228 318 L228 333 L92 333 Z',                         // base, stepped out twice onto the quay
      'M78 331 L242 331 L242 346 L78 346 Z' ],
    cuts: [ 'M101 131 C130 124 190 124 219 131', 'M121 190 C146 182 176 184 199 193', 'M122 223 C147 215 176 217 199 225' ],
    anchor: { cx: 160, contact: 346, top: 90, xs: [68, 46, 82], ys: [90, 134, 147, 318, 331] } },
  { name: 'GULL', seed: 53,
    shape: [
      'M95 152 C97 124 129 110 147 132 C157 145 162 161 191 176 C223 192 251 210 274 227 L263 237 C241 239 221 251 201 263 C181 275 150 279 128 267 C104 253 98 222 100 196 C100 184 98 176 94 171 L86 167 L55 163 L61 155 L92 154 Z',
      'M145 262 L152 262 L150 303 L143 303 Z', 'M163 266 L170 266 L170 303 L163 303 Z',  // legs
      'M118 300 L174 300 L174 308 L186 308 L186 316 L198 316 L198 388 L118 388 Z' ],   // piling; its top cut in two steps
    cuts: [ 'M116 141 L124 140', 'M151 180 C181 197 221 214 257 229', 'M160 216 C182 226 203 234 222 239' ],
    anchor: { cx: 158, contact: 388, top: 110, xs: [40], ys: [300, 132, 267] } },
  { name: 'WAVE', seed: 67,
    shape: [ 'M56 364 L56 250 C56 176 108 122 170 122 C215 122 241 150 237 187 C235 207 214 217 198 209 C214 197 212 171 188 167 C162 163 144 189 152 215 C160 239 194 247 218 233 C234 222 256 214 272 222 C280 226 284 236 284 246 L284 336 L271 336 L271 350 L258 350 L258 364 Z' ],
    cuts: [ 'M80 346 C76 260 106 184 166 150', 'M104 350 C102 300 112 262 134 240', 'M196 272 C222 260 244 258 263 268' ],
    anchor: { cx: 170, contact: 364, top: 122, xs: [114], ys: [122, 250] } },
  { name: 'ANCHOR', seed: 79,
    shape: [
      () => ({ d: loop(160, 100, 28, 1.2, 5, 12) + loop(160, 100, 11, .8, 6, 10), rule: 'evenodd' }),   // ring, heavy like the life ring
      'M86 136 L234 135 L235 160 L85 161 Z',                         // stock
      'M143 124 L177 124 L180 312 L140 312 Z',                       // shank, slightly flared
      // arms and crown: the crown meets the water in two steps, the mark's notch (same steps as the bow's stem)
      'M58 232 C64 292 104 326 134 326 L134 334 L149 334 L149 343 L171 343 L171 334 L186 334 L186 326 C216 326 256 292 262 232 L230 244 C224 278 196 298 160 298 C124 298 96 278 90 244 Z',
      'M46 270 L62 214 L100 256 Z', 'M274 270 L258 214 L220 256 Z' ],   // flukes
    water: 356,
    cuts: [ 'M160 184 L160 258', 'M120 148 C147 146 173 150 200 148', 'M80 262 C92 284 114 302 140 310' ],
    anchor: { cx: 160, contact: 343, top: 72, xs: [114, 75, 20], ys: [72, 135, 160, 214, 326] } },
];
})();

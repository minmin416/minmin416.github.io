# Sending animation

The default sending animation is a locally hosted copy of the Windows XP SHELL32 resource161 folder-to-folder copy animation, converted to a transparent GIF by the randomnoun article author. Source:

- https://www.randomnoun.com/wp/2013/10/27/windows-shell32-animations/
- https://www.randomnoun.com/wpf/shell32-avi/tshell32_161.gif

The downloaded GIF is272×60,20frames,an infinite loop,with2300ms percycle. It is served from `/assets/xp-file-copy.gif`; no external hotlink is used. Microsoft/Windows attribution identifies the original resource; no public-domain claim or verified redistribution license is asserted. The article describes extraction/conversion; it is not a confirmed standalone asset license. This site is not affiliated with Microsoft.

`/animation-preview.html` explicitly compares the original GIF with the earlier CSS recreation. The preview never submits a message or claims a stored inquiry. The actual form defaults to the GIF, pixel-masks away the Riverplo title while sending, and morphs the button into an XP progress bar. Success requires a matching durable server acknowledgement and a minimum3second visual duration. Reduced-motion mode uses a static sending label instead of the GIF.

The CSS recreation remains author-created comparison material and is not labeled as the original Windows asset. Build minification is ordinary optimization, not Apple-specific copy protection or encryption.


The single-submit form now decodes the unchanged original GIF with the locally bundled MIT decoder (THIRD_PARTY_NOTICES.md). It pixel-dissolves only the logo for350ms, then displays original decoded frame0 and plays two20-frame cycles (19×100ms+400ms percycle=2300ms). Loading/decoding is completed before the cycle clock starts. Only after both cycles does the POST begin. RequestAnimationFrame controls a canvas displaying the original GIF frames; this is not a replacement drawing/CSS animation or re-encoded asset. Browser scheduling/paint latency may extend duration; no physical frame-perfect timing guarantee is claimed. Visibility changes pause the clock; reduced-motion mode waits the same duration with a static visual. Native infinite-loop GIFs have no loop event, so a simple blind4.6second timeout is not used.

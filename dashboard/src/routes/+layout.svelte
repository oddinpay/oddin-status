<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	let { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);

	let base64 = "";

	function detectImageTypeFromBase64(base64:string): string {
  		const firstChar = base64.trim();

		switch (firstChar) {
 		  	 case '/': return 'image/jpeg';   // JPEG
  		 	 case 'i': return 'image/png';    // PNG
   			 case 'A': return 'image/ico'     // ICO
    		 case 'P': return 'image/svg+xml';// SVG
			 case 'U': return 'image/webp';   // WEBP
			 case 'T': return 'image/tiff';   // TIFF
			 case 'Q': return 'image/bmp';    // BMP
			 case 'AAAA': return 'image/avif';    // AVIF
			 default : return '';     // Default fallback
		}
	}

	let faviconUrl = `data:${detectImageTypeFromBase64(base64)};base64,${base64}`;

</script>

<svelte:head>
	<link rel="icon" href="{faviconUrl}" />
</svelte:head>

{@render children?.()}

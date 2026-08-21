<script lang="ts">
  import PixelBlast from "$lib/components/Pixel.svelte";
  let { data } = $props();
</script>

<svelte:head>
  <meta charset="utf-8" />
  <title>Unsubscribed • Oddinpay</title>
</svelte:head>

<div id="main">
  <div class="prism-bg">
    <PixelBlast
      variant="square"
      color={data.success ? "#cee6c8" : "#f87171"}
      pixelSize={3}
    />
  </div>

  <div class="fof">
    {#if data.success}
      <h1>Bye</h1>
      <p>You'll no longer receive status updates.</p>
    {:else}
      <h1>Invalid</h1>
      <p>The unsubscribe link is invalid.</p>
    {/if}
    <a href="/">Back to Home</a>
  </div>
</div>

<style>
  * {
    box-sizing: border-box;
  }

  #main {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    text-align: center;
    padding: 0 20px;
  }

  .prism-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .prism-bg :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  .fof {
    position: relative;
    z-index: 1;
    display: inline-block;
    text-align: center;
  }

  .fof h1 {
    font-size: 80px;
    font-weight: 700;
    display: inline-block;
    position: relative;
    padding-right: 16px;
    color: #222;
    animation: type-blink 1.5s ease-in-out infinite;
  }

  @keyframes type-blink {
    0% {
      box-shadow: inset -4px 0px 0px #222;
    }
    50% {
      box-shadow: inset -4px 0px 0px transparent;
    }
    100% {
      box-shadow: inset -4px 0px 0px #222;
    }
  }

  .fof p {
    font-size: 24px;
    margin: 20px 0;
    color: #222;
  }

  .fof a {
    display: inline-block;
    margin-top: 20px;
    padding: 14px 32px;
    font-size: 18px;
    text-decoration: none;
    color: #fff;
    background-color: #000;
    border-radius: 32px;
    transition:
      background-color 0.3s ease,
      transform 0.2s ease;
  }

  .fof a:active {
    background-color: #282828;
    transform: scale(0.98);
  }

  .fof a:hover {
    background-color: #333;
  }

  @media (max-width: 600px) {
    .fof h1 {
      font-size: 60px;
    }

    .fof p {
      font-size: 18px;
    }

    .fof a {
      font-size: 16px;
      padding: 10px 20px;
    }
  }
</style>

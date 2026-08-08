<script lang="ts">
  import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Heading,
    Section,
    Text,
  } from "@better-svelte-email/components";

  interface Props {
    name?: string;
  }

  let { name = "" }: Props = $props();

  const previewText = $derived(`Oh no! ${name} is experiencing issues!`);
</script>

<Html>
  <Head>
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />

    <style>
      :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
      }
    </style>
  </Head>

  <Body
    class="bg-yellow-50 mx-auto my-auto px-2 font-[Arial,Inter_Variable,Roboto,-apple-system] antialiased leading-relaxed font-medium"
  >
    <Preview preview={previewText} />
    <Container class="mx-auto max-w-116.25 p-4 my-10">
      <Section>
        <Link
          href="https://oddinpay.com"
          target="_blank"
          class="inline-block border-none rounded-lg overflow-hidden no-underline"
        >
          <Img
            src="https://cdn.oddinpay.com/oddinpay-status.png"
            alt="Oddinpay"
            width="60"
            height="60"
          />
        </Link>
      </Section>
      <Section class="py-2">
        <Heading as="h1" class="text-black text-3xl font-semibold">
          {name.includes(".")
            ? (() => {
                const parts = name.split(".");
                const mainPart =
                  parts.length > 2 ? parts[parts.length - 2] : parts[0];

                const formattedName =
                  mainPart.length <= 3
                    ? mainPart.toUpperCase()
                    : mainPart.charAt(0).toUpperCase() + mainPart.slice(1);

                return `${formattedName} is DEGRADED!`;
              })()
            : `${name} is DEGRADED!`}
        </Heading>

        <Section class="py-2 text-center">
          <img
            src="https://cdn.oddinpay.com/warn.png"
            alt="Status"
            width="100"
            height="100"
            class="mx-auto my-2"
          />
        </Section>

        <Text class="py-2 text-[15px] leading-relaxed font-medium text-black">
          Partial degradation has been identified with {name}. We are working to
          fix this as soon as possible. Thank you for your patience and
          understanding.
        </Text>

        <Hr class="mx-0 my-5 border-slate-300" />
      </Section>

      <Section class="py-2">
        <Text class="m-0 text-base text-slate-600">
          Thanks <br />
        </Text>
      </Section>

      <Section class="py-2">
        <Text class="m-0 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Oddinpay LLC.
        </Text>
      </Section>
    </Container>
  </Body>
</Html>

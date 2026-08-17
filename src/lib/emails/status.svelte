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
    username?: string;
    unsubscribeLink?: string;
  }

  let { username = "there", unsubscribeLink = "" }: Props = $props();

  const previewText = $derived(
    `Hello ${username}, you have successfully subscribed to oddin status updates!`,
  );
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
    class="bg-green-50 mx-auto my-auto px-2 font-[Arial,Inter_Variable,Roboto,-apple-system] antialiased leading-relaxed font-medium"
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
        <Heading as="h1" class="text-3xl font-semibold text-black">Subscribed!</Heading>

        <Section class="py-2 text-center">
          <Img
            src="https://cdn.oddinpay.com/success.png"
            alt="Status"
            width="100"
            height="100"
            class="mx-auto my-2"
          />
        </Section>

        <Text class="py-2 text-[16px] leading-relaxed font-medium text-black">
          You will receive email notifications whenever <Link
            class="text-[#2a8213] font-semibold hover:text-green-600"
            href="https://status.oddinpay.com">status</Link
          > creates, updates, or resolves an incident.
        </Text>

        <!-- <Text class="mx-0 text-[17px] leading-relaxed font-medium text-black">
          Keep an eye on your inbox for updates from us.
        </Text> -->

        <Hr class="mx-0 my-5 border-slate-300" />
        <Text class="m-0 mt-4 text-xs leading-5 text-slate-600">
          If you have any questions, we're here to help
          <Link
            href="mailto:support@oddinpay.com"
            class="text-xs text-slate-700 font-semibold underline"
          >
            support@oddinpay.com
          </Link>
        </Text>
      </Section>

      <Section class="py-2">
        <Text class="m-0 text-base text-slate-600">
          Thanks,<br />
          <span class="font-semibold">The Oddinpay Team</span>
        </Text>
      </Section>

      <Section class="mt-0 py-2 space-x-2">
        <Link
          href="https://www.linkedin.com/company/oddinpay"
          aria-label="Oddinpay on LinkedIn"
        >
          <Img
            src="https://cdn.oddinpay.com/linkedin.png"
            width="18"
            height="18"
            alt="oddinpay icon linkedin"
            class="inline-block"
          />
        </Link>

        <Link
          href="https://github.com/oddinpay"
          aria-label="Oddinpay on GitHub"
        >
          <Img
            src="https://cdn.oddinpay.com/github.png"
            width="18"
            height="18"
            alt="oddinpay icon github"
            class="inline-block"
          />
        </Link>
      </Section>

      <Section class="py-2">
        <Text class="m-0 text-xs text-slate-500 leading-loose"
          >Sent with care from</Text
        >

        <Text class="m-0 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Oddinpay LLC.
        </Text>
      </Section>
    </Container>
  </Body>
</Html>

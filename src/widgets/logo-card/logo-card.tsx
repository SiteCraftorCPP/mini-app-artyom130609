import { Card } from "@/ui/card";

import Logo from "@/assets/images/logo-big.svg";

export const LogoCard = () => {
  return (
    <section aria-labelledby="info-logo-title">
      <h2 id="info-logo-title" className="sr-only">
        ARTSHOP VIRTS
      </h2>
      <Card
        className="flex min-h-22 items-center justify-center px-4"
        bordered={true}
      >
        <Logo className="max-w-45" />
      </Card>
    </section>
  );
};

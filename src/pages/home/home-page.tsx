import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";

import {
  HOME_ACTION_GRADIENTS,
  HOME_ACTION_ICON,
  HOME_SCREEN_TEXT,
} from "@/shared/constants/home-screen";
import { HOME_SCREEN_MOCK } from "@/shared/mock/home-screen";

import Logo from "@/assets/images/artshop-virts-logo.svg";

import { HomeActionDialog } from "@/widgets/popup-app";

export const HomePage = () => {
  return (
    <div>
      <h1 className="sr-only">{HOME_SCREEN_TEXT.hero.sectionTitle}</h1>

      <section aria-labelledby="home-hero-title">
        <h2 id="home-hero-title" className="sr-only">
          {HOME_SCREEN_TEXT.hero.title}
        </h2>
        <Card
          className="mt-12 p-4"
          bordered={true}
          classNameWrapper="rounded-2xl"
        >
          <div className="mb-2 flex flex-col items-center">
            <Logo />
          </div>

          <ul className="flex flex-col gap-3">
            {HOME_SCREEN_MOCK.actions.map((action) => {
              return (
                <li key={action.id}>
                  <HomeActionDialog
                    actionId={action.id}
                    title={action.title}
                    description={action.description}
                  >
                    <Button
                      variant="brand"
                      size="pill"
                      className={[
                        "relative flex h-20 w-full items-center justify-start overflow-hidden border border-white/30 px-8 text-left",
                        HOME_ACTION_GRADIENTS[action.gradientToken],
                      ].join(" ")}
                    >
                      <AppText
                        className="relative z-10 text-[22px] font-bold leading-tight tracking-tight"
                        variant="heroButton"
                        size="heroButton"
                      >
                        {action.title}
                      </AppText>
                      <span className="absolute top-0 right-0 block text-white">
                        {HOME_ACTION_ICON[action.accent]}
                      </span>
                    </Button>
                  </HomeActionDialog>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
};

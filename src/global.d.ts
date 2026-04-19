declare module "*.module.css" {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg" {
  import React from "react";
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare const __PLATFORM__: "mobile" | "desktop";
declare const __ENV__: "production" | "development";

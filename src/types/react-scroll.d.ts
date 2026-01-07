declare module "react-scroll" {
  import * as React from "react";

  export interface LinkProps extends React.HTMLAttributes<HTMLElement> {
    to: string;
    smooth?: boolean | string;
    spy?: boolean;
    duration?: number;
    offset?: number;
    activeClass?: string;

    // props que a veces aparecen en la lib (opcionales)
    hashSpy?: boolean;
    isDynamic?: boolean;
    ignoreCancelEvents?: boolean;
    onSetActive?: (to: string) => void;
    onSetInactive?: (to: string) => void;
  }

  export const Link: React.FC<LinkProps>;
}

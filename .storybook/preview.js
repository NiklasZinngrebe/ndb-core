
import { setCompodocJson } from "@storybook/addon-docs/angular";
import "@angular/localize/init";
import docJson from "../documentation.json";
setCompodocJson(docJson);


export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  // layout: 'fullscreen', // remove paddings of storybook container
}

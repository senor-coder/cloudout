import { BaseService } from "./base.js";
import { SectionResource } from "../models.js";
import { map } from "lodash-es";
export class PlainTextService extends BaseService {
  static SERVICE_KEY = "$txt";

  constructor() {
    super();
  }

  async resolveResources(resourceReferences) {
    return map(resourceReferences, (resourceRef) => {
      return new SectionResource(resourceRef, resourceRef.context.value);
    });
  }

  serviceKey() {
    return PlainTextService.SERVICE_KEY;
  }

  parse(resourceReference) {
    const [service, value] = resourceReference.referenceValue.split(":", 2);
    context = {};
    if (service == this.serviceKey()) {
      context.value = value;
    } else {
      context.value = resourceReference.referenceValue;
    }

    return context;
  }
}

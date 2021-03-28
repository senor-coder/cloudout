export class BaseService {
  constructor() {
    if (this === BaseService) {
      throw new TypeError("Cannot instantiate AbstractClass");
    }
  }

  serviceKey(){
    throw new TypeError("To be implemented by the deriving class");
  }

  parse(resourceReference){
    throw new TypeError("To be implemented by the deriving class");
  }

  async resolveResources(resourceReferences) {
    throw new TypeError("To be implemented by the deriving class");
  }
}
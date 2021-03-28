export class SectionResourceReference{
  constructor(sectionName, referenceName, referenceValue, serviceName, context = {}){
    this.sectionName = sectionName;
    this.referenceName = referenceName;
    this.referenceValue = referenceValue;
    this.serviceName = serviceName;
    this.context = context;
  }
}

export class SectionResource{
  constructor(sectionResourceReference, value){
    this.sectionName = sectionResourceReference.sectionName;
    this.referenceName = sectionResourceReference.referenceName;
    this.referenceValue = sectionResourceReference.referenceValue;
    this.value = value;
    this.serviceName = sectionResourceReference.serviceName;
    this.context = sectionResourceReference.context;
  }
}
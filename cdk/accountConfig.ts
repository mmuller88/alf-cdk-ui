
export const prodAccount = {
  id: '981237193288',
  region: 'us-east-1',
  stage: 'prod',
  domainName: 'alfpro.net',
  subDomain: 'app',
  acmCertRef: 'arn:aws:acm:us-east-1:981237193288:certificate/62010fca-125e-4780-8d71-7d745ff91789',
  hostedZoneId: 'Z05027561FL1C7WWU4SX4',
  zoneName: 'alfpro.net.',
  // subDomain: process.env.SUB_DOMAIN || 'app',
}

export const devAccount = {
  id: '981237193288',
  region: 'eu-central-1',
  stage: 'dev',
  domainName: 'dev.alfpro.net',
  subDomain: 'app',
  acmCertRef: 'arn:aws:acm:us-east-1:981237193288:certificate/0c2cc2a7-b0aa-4201-8d9b-dc7c23154676',
  hostedZoneId: 'Z036396421QYOR6PI3CPX',
  zoneName: 'dev.alfpro.net.',
}

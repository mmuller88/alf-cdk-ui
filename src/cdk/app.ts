#!/usr/bin/env node
import 'source-map-support/register';
import { Tags, App } from '@aws-cdk/core';
import { name, devDependencies } from '../../package.json';
import { UIStack, UIStackProps } from './ui-stack';
import { UIPipelineStack, UIPipelineStackProps } from './ui-pipeline-stack';
// import { FrontendPipelineStackProps, FrontendPipelineStack } from './ui-pipeline-stack';

const app = new App();
Tags.of(app).add('Project', name);

const config = {
  // appVersion: version,
  // deployedAt: new Date().toISOString(),
  // deployBucketName: 'app.uniflow-dev.unimed.de',
  repositoryName: name,
  branch: 'master',
  runtime: { nodejs: 12 },
  cdkVersion: devDependencies['@aws-cdk/core'],
};

console.info(`Common config: ${JSON.stringify(config, null, 2)}`);

// const testAccount = {
//   id: '',
//   region: '',
//   stage: 'test',
//   // domainName: `uniflow-${devAccount.stage}.unimed.de`,
//   // acmCertRef: 'arn:aws:acm:us-east-1:495958373937:certificate/5881180e-a338-4b6e-a189-3fc6abf779c0',
//   // subDomain: process.env.SUB_DOMAIN || 'app',
// }

const prodAccount = {
  id: '981237193288',
  region: 'us-east-1',
  stage: 'prod',
  domainName: 'alfpro.net',
  subDomain: 'app',
  acmCertRef: 'arn:aws:acm:us-east-1:981237193288:certificate/62010fca-125e-4780-8d71-7d745ff91789',
  // subDomain: process.env.SUB_DOMAIN || 'app',
}


for(const account of [prodAccount]) {
  const uiStackProps : UIStackProps = {
    env: {
      account: account.id,
      region: account.region,
    },
    stage: account.stage,
    domainName: account.domainName,
    acmCertRef: account.acmCertRef,
    subDomain: account.subDomain,
    // subDomain: account.subDomain,
  }
  console.info(`${account.stage} UIStackProps: ${JSON.stringify(uiStackProps, null, 2)}`);

  // tslint:disable-next-line: no-unused-expression
  new UIStack(app, `${config.repositoryName}-${account.stage}`, uiStackProps);
}

const uiPipelineStackProps: UIPipelineStackProps = {
  env: {
    account: prodAccount.id,
    region: prodAccount.region,
  },
  cdkVersion: config.cdkVersion,
  // stackName: `${config.functionName}-pipeline-stack-build`,
  repositoryName: config.repositoryName,
  branch: config.branch,
  runtime: config.runtime,
  // deployBucketName: '',
  // domainName: '',
  // cloudfrontId: '',
  // bucketName: '',
  // bucketArn: ''
};
console.info(`uiPipelineStackProps: ${JSON.stringify(uiPipelineStackProps, null, 2)}`);

new UIPipelineStack(app, `${config.repositoryName}-pipeline-stack-build`, uiPipelineStackProps);

app.synth();

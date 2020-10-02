#!/usr/bin/env node
import { App, Tags } from '@aws-cdk/core';
import { UIStackProps, UIStack } from './ui-stack';
import { name, devDependencies } from './package.json';
import { UIPipelineStackProps, UIPipelineStack } from './ui-pipeline-stack';
import { prodAccount } from './accountConfig';

const app = new App();
Tags.of(app).add('Project', name);

export const config = {
  repositoryName: name,
  branch: 'master',
  runtime: { nodejs: 12 },
  cdkVersion: devDependencies['@aws-cdk/core'],
};

console.info(`Common config: ${JSON.stringify(config, null, 2)}`);

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
    hostedZoneId: account.hostedZoneId,
    zoneName: account.zoneName,
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

// tslint:disable-next-line: no-unused-expression
new UIPipelineStack(app, `${config.repositoryName}-pipeline-stack-build`, uiPipelineStackProps);

app.synth();

#!/usr/bin/env node
import { UIStack } from './ui-stack';
import { name } from './package.json';
import { PipelineApp } from 'alf-cdk-app-pipeline/pipeline-app';
import { sharedDevAccountProps, sharedProdAccountProps } from 'alf-cdk-app-pipeline/accountConfig';


// tslint:disable-next-line: no-unused-expression
new PipelineApp({
  branch: 'master',
  repositoryName: name,
  accounts: [
    {
      id: '981237193288',
      region: 'eu-central-1',
      stage: 'dev',
    },
    {
      id: '981237193288',
      region: 'us-east-1',
      stage: 'prod',
    },
  ],
  buildAccount: {
    id: '981237193288',
    region: 'eu-central-1',
    stage: 'dev',
  },
  customStack: (scope, account) => {
    const stageProps = {
      ...(account.stage === 'dev' ? {
        domainName: sharedDevAccountProps.domainName,
        acmCertRef: sharedDevAccountProps.acmCertRef,
        subDomain: sharedDevAccountProps.subDomain,
        hostedZoneId: sharedDevAccountProps.hostedZoneId,
        zoneName: sharedDevAccountProps.zoneName,
      } : { // prod stage
        domainName: sharedProdAccountProps.domainName,
        acmCertRef: sharedProdAccountProps.acmCertRef,
        subDomain: sharedProdAccountProps.subDomain,
        hostedZoneId: sharedProdAccountProps.hostedZoneId,
        zoneName: sharedProdAccountProps.zoneName,
      })
    };
    // console.log('echo = ' + JSON.stringify(account));
    return new UIStack(scope, `${name}-${account.stage}`, {
      env: {
        account: account.id,
        region: account.region,
      },
      stackName: `${name}-${account.stage}`,
      stage: account.stage,
      domainName: stageProps.domainName,
      acmCertRef: stageProps.acmCertRef,
      subDomain: stageProps.subDomain,
      hostedZoneId: stageProps.hostedZoneId,
      zoneName: stageProps.zoneName,
    })
  },
  buildCommand: 'npm run build',
  testCommands: (_) => [
    // Use 'curl' to GET the given URL and fail if it returns an error
    'curl -Ssf $domainName',
    'echo done!!!',
  ],
});

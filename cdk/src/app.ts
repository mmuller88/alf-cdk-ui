#!/usr/bin/env node
import { UIStack } from './ui-stack';
import { name } from '../../package.json';
import { PipelineApp } from 'alf-cdk-app-pipeline/pipeline-app';
import { sharedDevAccountProps, sharedProdAccountProps } from 'alf-cdk-app-pipeline/accountConfig';


// tslint:disable-next-line: no-unused-expression
new PipelineApp({
  branch: 'master',
  repositoryName: name,
  stageAccounts: [
    {
      account: {
        id: '981237193288',
        region: 'eu-central-1',
      },
      stage: 'dev',
    },
    {
      account: {
        id: '981237193288',
        region: 'us-east-1',
      },
      stage: 'prod',
    },
  ],
  buildAccount: {
    id: '981237193288',
    region: 'eu-central-1',
  },
  customStack: (scope, stageAccounts) => {
    const stageProps = {
      ...(stageAccounts.stage === 'dev' ? {
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
    return new UIStack(scope, `${name}-${stageAccounts.stage}`, {
      env: {
        account: stageAccounts.account.id,
        region: stageAccounts.account.region,
      },
      stackName: `${name}-${stageAccounts.stage}`,
      stage: stageAccounts.stage,
      domainName: stageProps.domainName,
      acmCertRef: stageProps.acmCertRef,
      subDomain: stageProps.subDomain,
      hostedZoneId: stageProps.hostedZoneId,
      zoneName: stageProps.zoneName,
    })
  },
  manualApprovals: (account) => {
    return account.stage === 'dev' ? false : true;
  },
  testCommands: (_) => [
    // Use 'curl' to GET the given URL and fail if it returns an error
    'curl -Ssf $domainName',
    'echo done!!!',
  ],
});

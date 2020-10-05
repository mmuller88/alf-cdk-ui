#!/usr/bin/env node
import { UIStack } from './ui-stack';
import { name } from './package.json';
import { PipelineApp } from 'alf-cdk-app-pipeline/pipeline-app';


// tslint:disable-next-line: no-unused-expression
new PipelineApp({
  branch: 'master',
  repositoryName: name,
  customStack: (scope, account) => {
    // console.log('echo = ' + JSON.stringify(account));
    return new UIStack(scope, `${name}-${account.stage}`, {
      stackName: `${name}-${account.stage}`,
      stage: account.stage,
      domainName: account.domainName,
      acmCertRef: account.acmCertRef,
      subDomain: account.subDomain,
      hostedZoneId: account.hostedZoneId,
      zoneName: account.zoneName,
    })
  },
  testCommands: [
    // Use 'curl' to GET the given URL and fail if it returns an error
    'curl -Ssf $domainName',
    'echo done!!!',
  ],
});

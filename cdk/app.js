#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const core_1 = require("@aws-cdk/core");
const ui_stack_1 = require("./ui-stack");
const package_json_1 = require("./package.json");
// import { FrontendPipelineStackProps, FrontendPipelineStack } from './ui-pipeline-stack';
const app = new core_1.App();
core_1.Tag.add(app, 'Project', package_json_1.name);
const config = {
    // appVersion: version,
    // deployedAt: new Date().toISOString(),
    // deployBucketName: 'app.uniflow-dev.unimed.de',
    repositoryName: package_json_1.name,
    branch: 'master',
    runtime: { nodejs: 12 },
    cdkVersion: package_json_1.devDependencies['@aws-cdk/core'],
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
};
for (const account of [prodAccount]) {
    const uiStackProps = {
        env: {
            account: account.id,
            region: account.region,
        },
        stage: account.stage,
        domainName: account.domainName,
        acmCertRef: account.acmCertRef,
        subDomain: account.subDomain,
    };
    console.info(`${account.stage} UIStackProps: ${JSON.stringify(uiStackProps, null, 2)}`);
    // tslint:disable-next-line: no-unused-expression
    new ui_stack_1.UIStack(app, `${config.repositoryName}-${account.stage}`, uiStackProps);
}
// const frontendPipelineStackProps: FrontendPipelineStackProps = {
//   env: {
//     account: buildAccount.id,
//     region: AllowedRegions.euCentral1,
//   },
//   cdkVersion: config.cdkVersion,
//   // stackName: `${config.functionName}-pipeline-stack-build`,
//   repositoryName: config.repositoryName,
//   branch: config.branch,
//   runtime: config.runtime,
//   skipInfrastructureDeploy: config.skipInfrastructureDeploy,
//   // deployBucketName: '',
//   // domainName: '',
//   // cloudfrontId: '',
//   // bucketName: '',
//   // bucketArn: ''
// };
// console.info(`frontendPipelineStackProps: ${JSON.stringify(frontendPipelineStackProps, null, 2)}`);
// new FrontendPipelineStack(app, `${config.functionName}-pipeline-stack-build`, frontendPipelineStackProps);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVDQUFxQztBQUNyQyx3Q0FBeUM7QUFDekMseUNBQW1EO0FBQ25ELGlEQUF1RDtBQUN2RCwyRkFBMkY7QUFFM0YsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFHLEVBQUUsQ0FBQztBQUN0QixVQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsbUJBQUksQ0FBQyxDQUFDO0FBRTlCLE1BQU0sTUFBTSxHQUFHO0lBQ2IsdUJBQXVCO0lBQ3ZCLHdDQUF3QztJQUN4QyxpREFBaUQ7SUFDakQsY0FBYyxFQUFFLG1CQUFJO0lBQ3BCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7SUFDdkIsVUFBVSxFQUFFLDhCQUFlLENBQUMsZUFBZSxDQUFDO0NBQzdDLENBQUM7QUFFRixPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRWxFLHdCQUF3QjtBQUN4QixZQUFZO0FBQ1osZ0JBQWdCO0FBQ2hCLG1CQUFtQjtBQUNuQiw0REFBNEQ7QUFDNUQsMEdBQTBHO0FBQzFHLG1EQUFtRDtBQUNuRCxJQUFJO0FBRUosTUFBTSxXQUFXLEdBQUc7SUFDbEIsRUFBRSxFQUFFLGNBQWM7SUFDbEIsTUFBTSxFQUFFLFdBQVc7SUFDbkIsS0FBSyxFQUFFLE1BQU07SUFDYixVQUFVLEVBQUUsWUFBWTtJQUN4QixTQUFTLEVBQUUsS0FBSztJQUNoQixVQUFVLEVBQUUscUZBQXFGO0NBRWxHLENBQUE7QUFHRCxLQUFJLE1BQU0sT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7SUFDbEMsTUFBTSxZQUFZLEdBQWtCO1FBQ2xDLEdBQUcsRUFBRTtZQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNuQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07U0FDdkI7UUFDRCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7S0FFN0IsQ0FBQTtJQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxrQkFBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUV4RixpREFBaUQ7SUFDakQsSUFBSSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO0NBQzdFO0FBRUQsbUVBQW1FO0FBQ25FLFdBQVc7QUFDWCxnQ0FBZ0M7QUFDaEMseUNBQXlDO0FBQ3pDLE9BQU87QUFDUCxtQ0FBbUM7QUFDbkMsaUVBQWlFO0FBQ2pFLDJDQUEyQztBQUMzQywyQkFBMkI7QUFDM0IsNkJBQTZCO0FBQzdCLCtEQUErRDtBQUMvRCw2QkFBNkI7QUFDN0IsdUJBQXVCO0FBQ3ZCLHlCQUF5QjtBQUN6Qix1QkFBdUI7QUFDdkIscUJBQXFCO0FBQ3JCLEtBQUs7QUFDTCxzR0FBc0c7QUFFdEcsNkdBQTZHO0FBRTdHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCB7IFRhZywgQXBwIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBVSVN0YWNrUHJvcHMsIFVJU3RhY2sgfSBmcm9tICcuL3VpLXN0YWNrJztcbmltcG9ydCB7IG5hbWUsIGRldkRlcGVuZGVuY2llcyB9IGZyb20gJy4vcGFja2FnZS5qc29uJztcbi8vIGltcG9ydCB7IEZyb250ZW5kUGlwZWxpbmVTdGFja1Byb3BzLCBGcm9udGVuZFBpcGVsaW5lU3RhY2sgfSBmcm9tICcuL3VpLXBpcGVsaW5lLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuVGFnLmFkZChhcHAsICdQcm9qZWN0JywgbmFtZSk7XG5cbmNvbnN0IGNvbmZpZyA9IHtcbiAgLy8gYXBwVmVyc2lvbjogdmVyc2lvbixcbiAgLy8gZGVwbG95ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAvLyBkZXBsb3lCdWNrZXROYW1lOiAnYXBwLnVuaWZsb3ctZGV2LnVuaW1lZC5kZScsXG4gIHJlcG9zaXRvcnlOYW1lOiBuYW1lLFxuICBicmFuY2g6ICdtYXN0ZXInLFxuICBydW50aW1lOiB7IG5vZGVqczogMTIgfSxcbiAgY2RrVmVyc2lvbjogZGV2RGVwZW5kZW5jaWVzWydAYXdzLWNkay9jb3JlJ10sXG59O1xuXG5jb25zb2xlLmluZm8oYENvbW1vbiBjb25maWc6ICR7SlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKX1gKTtcblxuLy8gY29uc3QgdGVzdEFjY291bnQgPSB7XG4vLyAgIGlkOiAnJyxcbi8vICAgcmVnaW9uOiAnJyxcbi8vICAgc3RhZ2U6ICd0ZXN0Jyxcbi8vICAgLy8gZG9tYWluTmFtZTogYHVuaWZsb3ctJHtkZXZBY2NvdW50LnN0YWdlfS51bmltZWQuZGVgLFxuLy8gICAvLyBhY21DZXJ0UmVmOiAnYXJuOmF3czphY206dXMtZWFzdC0xOjQ5NTk1ODM3MzkzNzpjZXJ0aWZpY2F0ZS81ODgxMTgwZS1hMzM4LTRiNmUtYTE4OS0zZmM2YWJmNzc5YzAnLFxuLy8gICAvLyBzdWJEb21haW46IHByb2Nlc3MuZW52LlNVQl9ET01BSU4gfHwgJ2FwcCcsXG4vLyB9XG5cbmNvbnN0IHByb2RBY2NvdW50ID0ge1xuICBpZDogJzk4MTIzNzE5MzI4OCcsXG4gIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gIHN0YWdlOiAncHJvZCcsXG4gIGRvbWFpbk5hbWU6ICdhbGZwcm8ubmV0JyxcbiAgc3ViRG9tYWluOiAnYXBwJyxcbiAgYWNtQ2VydFJlZjogJ2Fybjphd3M6YWNtOnVzLWVhc3QtMTo5ODEyMzcxOTMyODg6Y2VydGlmaWNhdGUvNjIwMTBmY2EtMTI1ZS00NzgwLThkNzEtN2Q3NDVmZjkxNzg5JyxcbiAgLy8gc3ViRG9tYWluOiBwcm9jZXNzLmVudi5TVUJfRE9NQUlOIHx8ICdhcHAnLFxufVxuXG5cbmZvcihjb25zdCBhY2NvdW50IG9mIFtwcm9kQWNjb3VudF0pIHtcbiAgY29uc3QgdWlTdGFja1Byb3BzIDogVUlTdGFja1Byb3BzID0ge1xuICAgIGVudjoge1xuICAgICAgYWNjb3VudDogYWNjb3VudC5pZCxcbiAgICAgIHJlZ2lvbjogYWNjb3VudC5yZWdpb24sXG4gICAgfSxcbiAgICBzdGFnZTogYWNjb3VudC5zdGFnZSxcbiAgICBkb21haW5OYW1lOiBhY2NvdW50LmRvbWFpbk5hbWUsXG4gICAgYWNtQ2VydFJlZjogYWNjb3VudC5hY21DZXJ0UmVmLFxuICAgIHN1YkRvbWFpbjogYWNjb3VudC5zdWJEb21haW4sXG4gICAgLy8gc3ViRG9tYWluOiBhY2NvdW50LnN1YkRvbWFpbixcbiAgfVxuICBjb25zb2xlLmluZm8oYCR7YWNjb3VudC5zdGFnZX0gVUlTdGFja1Byb3BzOiAke0pTT04uc3RyaW5naWZ5KHVpU3RhY2tQcm9wcywgbnVsbCwgMil9YCk7XG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby11bnVzZWQtZXhwcmVzc2lvblxuICBuZXcgVUlTdGFjayhhcHAsIGAke2NvbmZpZy5yZXBvc2l0b3J5TmFtZX0tJHthY2NvdW50LnN0YWdlfWAsIHVpU3RhY2tQcm9wcyk7XG59XG5cbi8vIGNvbnN0IGZyb250ZW5kUGlwZWxpbmVTdGFja1Byb3BzOiBGcm9udGVuZFBpcGVsaW5lU3RhY2tQcm9wcyA9IHtcbi8vICAgZW52OiB7XG4vLyAgICAgYWNjb3VudDogYnVpbGRBY2NvdW50LmlkLFxuLy8gICAgIHJlZ2lvbjogQWxsb3dlZFJlZ2lvbnMuZXVDZW50cmFsMSxcbi8vICAgfSxcbi8vICAgY2RrVmVyc2lvbjogY29uZmlnLmNka1ZlcnNpb24sXG4vLyAgIC8vIHN0YWNrTmFtZTogYCR7Y29uZmlnLmZ1bmN0aW9uTmFtZX0tcGlwZWxpbmUtc3RhY2stYnVpbGRgLFxuLy8gICByZXBvc2l0b3J5TmFtZTogY29uZmlnLnJlcG9zaXRvcnlOYW1lLFxuLy8gICBicmFuY2g6IGNvbmZpZy5icmFuY2gsXG4vLyAgIHJ1bnRpbWU6IGNvbmZpZy5ydW50aW1lLFxuLy8gICBza2lwSW5mcmFzdHJ1Y3R1cmVEZXBsb3k6IGNvbmZpZy5za2lwSW5mcmFzdHJ1Y3R1cmVEZXBsb3ksXG4vLyAgIC8vIGRlcGxveUJ1Y2tldE5hbWU6ICcnLFxuLy8gICAvLyBkb21haW5OYW1lOiAnJyxcbi8vICAgLy8gY2xvdWRmcm9udElkOiAnJyxcbi8vICAgLy8gYnVja2V0TmFtZTogJycsXG4vLyAgIC8vIGJ1Y2tldEFybjogJydcbi8vIH07XG4vLyBjb25zb2xlLmluZm8oYGZyb250ZW5kUGlwZWxpbmVTdGFja1Byb3BzOiAke0pTT04uc3RyaW5naWZ5KGZyb250ZW5kUGlwZWxpbmVTdGFja1Byb3BzLCBudWxsLCAyKX1gKTtcblxuLy8gbmV3IEZyb250ZW5kUGlwZWxpbmVTdGFjayhhcHAsIGAke2NvbmZpZy5mdW5jdGlvbk5hbWV9LXBpcGVsaW5lLXN0YWNrLWJ1aWxkYCwgZnJvbnRlbmRQaXBlbGluZVN0YWNrUHJvcHMpO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==
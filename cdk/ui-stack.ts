import { StackProps, Construct, CfnOutput } from 'alf-cdk-app-pipeline/node_modules/@aws-cdk/core';
import { AutoDeleteBucket } from 'alf-cdk-app-pipeline/node_modules/@mobileposse/auto-delete-bucket'
import { BucketDeployment, Source } from 'alf-cdk-app-pipeline/node_modules/@aws-cdk/aws-s3-deployment';
import {
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
  SSLMethod,
  SecurityPolicyProtocol
} from 'alf-cdk-app-pipeline/node_modules/@aws-cdk/aws-cloudfront';
import { ARecord, HostedZone, RecordTarget } from 'alf-cdk-app-pipeline/node_modules/@aws-cdk/aws-route53';
import { CloudFrontTarget } from 'alf-cdk-app-pipeline/node_modules/@aws-cdk/aws-route53-targets';
// @ts-ignore
import codedeploy = require('alf-cdk-app-pipeline/node_modules/@aws-cdk/aws-codedeploy');
// @ts-ignore
import lambda = require('alf-cdk-app-pipeline/node_modules/@aws-cdk/aws-lambda');
// @ts-ignore
import core = require('alf-cdk-app-pipeline/node_modules/@aws-cdk/core');
import { CustomStack } from 'alf-cdk-app-pipeline/custom-stack';
// import { CustomStack } from '../../alf-cdk-app-pipeline/custom-stack';


export interface UIStackProps extends StackProps {
  stage: string;
  acmCertRef: string;
  domainName: string;
  subDomain: string;
  hostedZoneId: string;
  zoneName: string;
  // deployedAt: string;
  // appVersion: string;
}

export class UIStack extends CustomStack {

  public readonly domainName: CfnOutput;

  constructor(scope: Construct, id: string, props: UIStackProps) {
    super(scope, id, props);

    const bucket = new AutoDeleteBucket(this, props.domainName, {
      bucketName: `${props.subDomain}.${props.domainName}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      removalPolicy: core.RemovalPolicy.DESTROY,
    });

    const cloudFrontOAI = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${props.domainName} website.`,
    });

    const cloudFrontDistProps: CloudFrontWebDistributionProps = {
      aliasConfiguration: {
          acmCertRef: props.acmCertRef,
          names: [ `${props.subDomain}.${props.domainName}` ],
          sslMethod: SSLMethod.SNI,
          securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          errorCachingMinTtl: 60,
          responseCode: 200,
          responsePagePath: "/index.html"
        }
      ]
    };

    const cloudfrontDistribution = new CloudFrontWebDistribution(
      this,
      `${props.subDomain}.${props.domainName}-cfd`,
      cloudFrontDistProps
    );

    // tslint:disable-next-line: no-unused-expression
    new BucketDeployment(this, `DeployApp-${new Date().toString()}`, {
      sources: [Source.asset("../build")],
      destinationBucket: bucket,
      distribution: cloudfrontDistribution,
      distributionPaths: ['/'],
    });

    // const zone = HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    const route = new ARecord(this, 'SiteAliasRecord', {
      recordName: `${props.subDomain}.${props.domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(cloudfrontDistribution)),
      zone: HostedZone.fromHostedZoneAttributes(this, 'HostedZoneId', { zoneName: props.zoneName, hostedZoneId: props.hostedZoneId }),
    });

    this.domainName = new CfnOutput(this, 'route', {
      value: route.domainName,
    });

    // console.log('cfnOutputs = ' + JSON.stringify(this.cfnOutputs));

    this.cfnOutputs['domainName'] = this.domainName;

    // this.cfnOutputs.set('domainName', this.domainName);
  }

}

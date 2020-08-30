import { StackProps, Construct, CfnOutput } from '@aws-cdk/core';
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket'
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import {
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
  SSLMethod,
  SecurityPolicyProtocol
} from '@aws-cdk/aws-cloudfront';
import { ARecord, AddressRecordTarget, HostedZone } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
// @ts-ignore
import codedeploy = require('@aws-cdk/aws-codedeploy');
// @ts-ignore
import lambda = require('@aws-cdk/aws-lambda');
// @ts-ignore
import core = require('@aws-cdk/core');


export interface UIStackProps extends StackProps {
  stage: string;
  acmCertRef: string;
  domainName: string;
  subDomain: string;
  // deployedAt: string;
  // appVersion: string;
}

export class UIStack extends core.Stack {

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

    new BucketDeployment(this, `DeployApp-${new Date().toString()}`, {
      sources: [Source.asset("../build")],
      destinationBucket: bucket,
      distribution: cloudfrontDistribution,
      distributionPaths: ['/'],
    });

    const zone = HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    const route = new ARecord(this, 'SiteAliasRecord', {
      recordName: `${props.subDomain}.${props.domainName}`,
      target: AddressRecordTarget.fromAlias(new CloudFrontTarget(cloudfrontDistribution)),
      zone
    });

    new CfnOutput(this, 'route', {
      value: route.domainName,
    });
  }

}

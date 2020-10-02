import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { prodAccount } from './accountConfig';
import { config } from './app';
import { UIStack, UIStackProps } from './ui-stack';

/**
 * Deployable unit of web service app
 */
export class FrontendStage extends Stage {
  public readonly domainName: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const uiStackProps : UIStackProps = {
      // env: {
      //   account: prodAccount.id,
      //   region: prodAccount.region,
      // },
      stage: prodAccount.stage,
      domainName: prodAccount.domainName,
      acmCertRef: prodAccount.acmCertRef,
      subDomain: prodAccount.subDomain,
      stackName: `${config.repositoryName}-${prodAccount.stage}`,
      // subDomain: account.subDomain,
    }
    console.info(`${prodAccount.stage} UIStackProps: ${JSON.stringify(uiStackProps, null, 2)}`);

    // tslint:disable-next-line: no-unused-expression
    const uiStack = new UIStack(this, `${config.repositoryName}-${prodAccount.stage}`, uiStackProps);

    // Expose CdkpipelinesDemoStack's output one level higher
    this.domainName = uiStack.domainName;
  }
}

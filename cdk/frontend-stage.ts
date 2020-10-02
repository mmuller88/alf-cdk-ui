import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { UIStack, UIStackProps } from './ui-stack';

export interface FrontendStageProps extends StageProps {
  stackProps: UIStackProps;
}
/**
 * Deployable unit of web service app
 */
export class FrontendStage extends Stage {
  public readonly domainName: CfnOutput;

  constructor(scope: Construct, id: string, props: FrontendStageProps) {
    super(scope, id, props);

    // tslint:disable-next-line: no-unused-expression
    const uiStack = new UIStack(this, `UIStack`, props?.stackProps);

    // Expose CdkpipelinesDemoStack's output one level higher
    this.domainName = uiStack.domainName;
  }
}

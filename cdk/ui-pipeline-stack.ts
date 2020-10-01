import { Artifact } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { App, Stack, StackProps, SecretValue, Tags } from '@aws-cdk/core';
// import { ServicePrincipal, Role, ManagedPolicy } from '@aws-cdk/aws-iam';
// import { BuildEnvironmentVariableType, PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { prodAccount } from './accountConfig';
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines";
import { FrontendStage } from './frontend-stage';
// import { StringParameter } from '@aws-cdk/aws-ssm';
// import { prodAccount } from './app';

export interface UIPipelineStackProps extends StackProps {
  cdkVersion: string;
  // domainName: string;
  repositoryName: string;
  branch: string;
  runtime: {[k: string]: string | number};
}

// function createRoleProfile(account: AccountConfig) {
//   return [
//     `aws --profile unimed-${account.stage} configure set source_profile damadden88`,
//     `aws --profile unimed-${account.stage} configure set role_arn 'arn:aws:iam::${account.id}:role/unimed-${account.stage}'`,
//     `aws --profile unimed-${account.stage} configure set region ${AllowedRegions.euCentral1}`,
//   ];
// }

export class UIPipelineStack extends Stack {
  constructor(app: App, id: string, props: UIPipelineStackProps) {
    super(app, id, props);

    Tags.of(this).add('FrontendPipeline', this.stackName);

    // const pipeline = new Pipeline(this, `${this.stackName}-pipeline`, {
    //   pipelineName: `${this.stackName}-pipeline`,
    // });

    // const cdkDeployRole = new Role(this, 'createInstanceBuildRole', {
    //   assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
    //   managedPolicies: [
    //     ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
    //   ],
    // });


    // const sourceOutput = new Artifact();

    // const oauth = StringParameter.valueForSecureStringParameter(
    //   this, 'muller88-github-token', 1);
    const oauth = SecretValue.secretsManager('alfcdk', {
      jsonField: 'muller88-github-token',
    });

    // pipeline.addStage({
    //   stageName: 'Source',
    //   actions: [
    //     gitSource,
    //   ],
    // });

    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      // The pipeline name
      pipelineName: `${this.stackName}-pipeline`,
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new GitHubSourceAction({
        actionName: 'GithubSource',
        branch: props.branch,
        owner: 'mmuller88',
        repo: 'alf-cdk-ui',
        oauthToken: oauth,
        output: sourceArtifact,
      }),

      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: `make install && npm install -g aws-cdk@${props.cdkVersion}`,
        synthCommand: 'make cdksynthprod',
        // We need a build step to compile the TypeScript Lambda
        buildCommand: 'make build && make cdkbuild'
      }),
    });

    // todo: add devAccount later
    for (const account of [prodAccount]) {
      const frontendStage = new FrontendStage(this, 'FrontendStage', {
        env: {
          account: account.id,
          region: account.region,
        },
      });
      const preprodStage = pipeline.addApplicationStage(frontendStage);
      preprodStage.addActions(new ShellScriptAction({
        actionName: 'TestFrontend',
        useOutputs: {
          // Get the stack Output from the Stage and make it available in
          // the shell script as $ENDPOINT_URL.
          ENDPOINT_URL: pipeline.stackOutput(frontendStage.domainName),
        },
        commands: [
          // Use 'curl' to GET the given URL and fail if it returns an error
          'curl -Ssf $ENDPOINT_URL',
          'echo done!!!',
        ],
      }));
    }
  }
}

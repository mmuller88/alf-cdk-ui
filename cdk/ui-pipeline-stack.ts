import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { App, Stack, StackProps, SecretValue, Tags } from '@aws-cdk/core';
// import { ServicePrincipal, Role, ManagedPolicy } from '@aws-cdk/aws-iam';
// import { BuildEnvironmentVariableType, PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { prodAccount } from './accountConfig';
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines";
import { FrontendStage } from './frontend-stage';
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket';


export interface UIPipelineStackProps extends StackProps {
  cdkVersion: string;
  // domainName: string;
  repositoryName: string;
  branch: string;
  runtime: {[k: string]: string | number};
}

export class UIPipelineStack extends Stack {
  constructor(app: App, id: string, props: UIPipelineStackProps) {
    super(app, id, props);

    Tags.of(this).add('FrontendPipeline', this.stackName);

    const oauth = SecretValue.secretsManager('alfcdk', {
      jsonField: 'muller88-github-token',
    });

    const sourceBucket = new AutoDeleteBucket(this, 'PipeBucket', {
      versioned: true,
    });

    const pipeline = new Pipeline(this, 'Pipeline', {
      artifactBucket: sourceBucket,
      restartExecutionOnUpdate: true,
    });

    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const cdkPipeline = new CdkPipeline(this, 'CdkPipeline', {
      // The pipeline name
      // pipelineName: `${this.stackName}-pipeline`,
      cloudAssemblyArtifact,
      codePipeline: pipeline,

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
        // subdirectory: 'cdk',
        // We need a build step to compile the TypeScript Lambda
        buildCommand: 'make build && make cdkbuild',
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
      const preprodStage = cdkPipeline.addApplicationStage(frontendStage);
      preprodStage.addActions(new ShellScriptAction({
        actionName: 'TestFrontend',
        useOutputs: {
          // Get the stack Output from the Stage and make it available in
          // the shell script as $ENDPOINT_URL.
          ENDPOINT_URL: cdkPipeline.stackOutput(frontendStage.domainName),
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPipelineStack = void 0;
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
// import { StringParameter } from '@aws-cdk/aws-ssm';
// import { prodAccount } from './app';
const prodAccount = {
    id: '981237193288',
    region: 'us-east-1',
    stage: 'prod',
    domainName: 'alfpro.net',
    subDomain: 'app',
    acmCertRef: 'arn:aws:acm:us-east-1:981237193288:certificate/62010fca-125e-4780-8d71-7d745ff91789',
};
// function createRoleProfile(account: AccountConfig) {
//   return [
//     `aws --profile unimed-${account.stage} configure set source_profile damadden88`,
//     `aws --profile unimed-${account.stage} configure set role_arn 'arn:aws:iam::${account.id}:role/unimed-${account.stage}'`,
//     `aws --profile unimed-${account.stage} configure set region ${AllowedRegions.euCentral1}`,
//   ];
// }
class UIPipelineStack extends core_1.Stack {
    constructor(app, id, props) {
        super(app, id, props);
        core_1.Tag.add(this, 'FrontendPipeline', this.stackName);
        const pipeline = new aws_codepipeline_1.Pipeline(this, `${this.stackName}-pipeline`, {
            pipelineName: `${this.stackName}-pipeline`,
        });
        const cdkDeployRole = new aws_iam_1.Role(this, 'createInstanceBuildRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('codebuild.amazonaws.com'),
            managedPolicies: [
                // ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
                // ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                // ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
            ],
        });
        const cdkBuild = new aws_codebuild_1.PipelineProject(this, `${this.stackName}-build`, {
            projectName: `${this.stackName}-build`,
            role: cdkDeployRole,
            buildSpec: aws_codebuild_1.BuildSpec.fromObject({
                env: { 'git-credential-helper': 'yes' },
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': props.runtime,
                        commands: ['npm install',
                            `npm install -g aws-cdk@${props.cdkVersion}`,
                        ],
                    },
                    build: {
                        commands: [
                            'npm run build',
                            'ls -la',
                        ],
                    },
                    post_build: {
                        commands: [
                        // 'npm run test',
                        ],
                    },
                },
            }),
            environment: {
                buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
            },
        });
        const cdkDeployBuild = new aws_codebuild_1.PipelineProject(this, `${this.stackName}-deployBuild`, {
            projectName: `${this.stackName}-deployBuild`,
            role: cdkDeployRole,
            environmentVariables: {
                deployerAccessKeyId: {
                    value: 'deployer-access-key-id',
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PARAMETER_STORE,
                },
                deployerSecretAccessKey: {
                    value: 'deployer-secret-access-key',
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PARAMETER_STORE,
                },
            },
            buildSpec: aws_codebuild_1.BuildSpec.fromObject({
                env: { 'git-credential-helper': 'yes' },
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': props.runtime,
                        commands: [
                            'aws --profile damadden88 configure set aws_access_key_id $deployerAccessKeyId',
                            'aws --profile damadden88 configure set aws_secret_access_key $deployerSecretAccessKey',
                            // @ts-ignore
                            `aws --profile default configure set region ${props.env.region}`,
                            // // @ts-ignore
                            // ...createRoleProfile(devAccount),
                            // // @ts-ignore
                            // ...createRoleProfile(qaAccount),
                            // // @ts-ignore
                            // ...createRoleProfile(prodAccount),
                            'npm install',
                            'cd cdk && npm install && cd ..',
                            `npm install -g aws-cdk@${props.cdkVersion}`,
                        ],
                    },
                    build: {
                        commands: [
                            'npm run build',
                            // 'cd build && npm install --only=production && cd ..',
                            'ls -la',
                            'echo "run: $CDK_COMMAND"',
                            'eval $CDK_COMMAND',
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'build',
                    files: [
                        '**/*',
                    ],
                },
            }),
            environment: {
                buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
            },
        });
        const sourceOutput = new aws_codepipeline_1.Artifact();
        const cdkBuildOutput = new aws_codepipeline_1.Artifact(`${this.stackName}-cdk-build-output`);
        // const oauth = StringParameter.valueForSecureStringParameter(
        //   this, 'muller88-github-token', 1);
        const oauth = core_1.SecretValue.secretsManager('alfcdk', {
            jsonField: 'muller88-github-token',
        });
        const gitSource = new aws_codepipeline_actions_1.GitHubSourceAction({
            actionName: 'GithubSource',
            branch: props.branch,
            owner: 'mmuller88',
            repo: 'alf-cdk-ui',
            oauthToken: oauth,
            output: sourceOutput,
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                gitSource,
            ],
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [
                new aws_codepipeline_actions_1.CodeBuildAction({
                    actionName: 'CdkLintAndBuild',
                    project: cdkBuild,
                    input: sourceOutput,
                    outputs: [cdkBuildOutput],
                }),
            ],
        });
        // todo: add devAccount later
        for (const account of [prodAccount]) {
            const deployStage = pipeline.addStage({
                stageName: `DeployStage${account.stage[0].toUpperCase()}${account.stage.slice(1)}`,
            });
            deployStage.addAction(new aws_codepipeline_actions_1.CodeBuildAction({
                input: sourceOutput,
                environmentVariables: {
                    CDK_COMMAND: { value: `cd cdk && cdk diff '${this.stackName}-${account.stage}' --profile unimed-${account.stage} || true` },
                },
                project: cdkDeployBuild,
                actionName: 'CreateDiff',
                runOrder: 1,
            }));
            // If not in dev stage, ask for approvement before deploying
            // if (account.id !== devAccount.id) {
            //   deployStage.addAction(new ManualApprovalAction({
            //     actionName: 'ApproveDiff',
            //     runOrder: 2,
            //   }));
            // }
            deployStage.addAction(new aws_codepipeline_actions_1.CodeBuildAction({
                input: sourceOutput,
                environmentVariables: {
                    // CDK_COMMAND: { value: `cdk deploy '${this.stackName}-${account.stage}' --require-approval never --profile ${account.stage}` },
                    CDK_COMMAND: { value: `make cdkdeploy${account.stage}` },
                },
                project: cdkDeployBuild,
                actionName: 'DeployBuild',
                runOrder: 3,
            }));
        }
    }
}
exports.UIPipelineStack = UIPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1waXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnRUFBK0Q7QUFDL0QsZ0ZBQXdGO0FBQ3hGLHdDQUF5RTtBQUN6RSw4Q0FBeUU7QUFDekUsMERBQW1IO0FBQ25ILHNEQUFzRDtBQUN0RCx1Q0FBdUM7QUFFdkMsTUFBTSxXQUFXLEdBQUc7SUFDbEIsRUFBRSxFQUFFLGNBQWM7SUFDbEIsTUFBTSxFQUFFLFdBQVc7SUFDbkIsS0FBSyxFQUFFLE1BQU07SUFDYixVQUFVLEVBQUUsWUFBWTtJQUN4QixTQUFTLEVBQUUsS0FBSztJQUNoQixVQUFVLEVBQUUscUZBQXFGO0NBRWxHLENBQUE7QUFVRCx1REFBdUQ7QUFDdkQsYUFBYTtBQUNiLHVGQUF1RjtBQUN2RixnSUFBZ0k7QUFDaEksaUdBQWlHO0FBQ2pHLE9BQU87QUFDUCxJQUFJO0FBRUosTUFBYSxlQUFnQixTQUFRLFlBQUs7SUFDeEMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQzNELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLFVBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO1lBQ2hFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLFdBQVc7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxjQUFJLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQzlELFNBQVMsRUFBRSxJQUFJLDBCQUFnQixDQUFDLHlCQUF5QixDQUFDO1lBQzFELGVBQWUsRUFBRTtnQkFDZixzRUFB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LENBQUM7Z0JBQ3hDLEtBQUssRUFBRSxZQUFZO2dCQUNuQixvQkFBb0IsRUFBRTtvQkFDcEIsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxLQUFLLHNCQUFzQixPQUFPLENBQUMsS0FBSyxVQUFVLEVBQUU7aUJBQzVIO2dCQUNELE9BQU8sRUFBRSxjQUFjO2dCQUN2QixVQUFVLEVBQUUsWUFBWTtnQkFDeEIsUUFBUSxFQUFFLENBQUM7YUFDWixDQUFDLENBQUMsQ0FBQztZQUVKLDREQUE0RDtZQUM1RCxzQ0FBc0M7WUFDdEMscURBQXFEO1lBQ3JELGlDQUFpQztZQUNqQyxtQkFBbUI7WUFDbkIsU0FBUztZQUNULElBQUk7WUFFSixXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksMENBQWUsQ0FBQztnQkFDeEMsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLG9CQUFvQixFQUFFO29CQUNwQixpSUFBaUk7b0JBQ2pJLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFO2lCQUN6RDtnQkFDRCxPQUFPLEVBQUUsY0FBYztnQkFDdkIsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLFFBQVEsRUFBRSxDQUFDO2FBQ1osQ0FBQyxDQUFDLENBQUM7U0FDTDtJQUNILENBQUM7Q0FDRjtBQTlMRCwwQ0E4TEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQaXBlbGluZSwgQXJ0aWZhY3QgfSBmcm9tICdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lJztcbmltcG9ydCB7IENvZGVCdWlsZEFjdGlvbiwgR2l0SHViU291cmNlQWN0aW9uIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcbmltcG9ydCB7IEFwcCwgU3RhY2ssIFN0YWNrUHJvcHMsIFRhZywgU2VjcmV0VmFsdWUgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IFNlcnZpY2VQcmluY2lwYWwsIFJvbGUsIE1hbmFnZWRQb2xpY3kgfSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCB7IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUsIFBpcGVsaW5lUHJvamVjdCwgQnVpbGRTcGVjLCBMaW51eEJ1aWxkSW1hZ2UgfSBmcm9tICdAYXdzLWNkay9hd3MtY29kZWJ1aWxkJztcbi8vIGltcG9ydCB7IFN0cmluZ1BhcmFtZXRlciB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1zc20nO1xuLy8gaW1wb3J0IHsgcHJvZEFjY291bnQgfSBmcm9tICcuL2FwcCc7XG5cbmNvbnN0IHByb2RBY2NvdW50ID0ge1xuICBpZDogJzk4MTIzNzE5MzI4OCcsXG4gIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gIHN0YWdlOiAncHJvZCcsXG4gIGRvbWFpbk5hbWU6ICdhbGZwcm8ubmV0JyxcbiAgc3ViRG9tYWluOiAnYXBwJyxcbiAgYWNtQ2VydFJlZjogJ2Fybjphd3M6YWNtOnVzLWVhc3QtMTo5ODEyMzcxOTMyODg6Y2VydGlmaWNhdGUvNjIwMTBmY2EtMTI1ZS00NzgwLThkNzEtN2Q3NDVmZjkxNzg5JyxcbiAgLy8gc3ViRG9tYWluOiBwcm9jZXNzLmVudi5TVUJfRE9NQUlOIHx8ICdhcHAnLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGlwZWxpbmVTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIGNka1ZlcnNpb246IHN0cmluZztcbiAgLy8gZG9tYWluTmFtZTogc3RyaW5nO1xuICByZXBvc2l0b3J5TmFtZTogc3RyaW5nO1xuICBicmFuY2g6IHN0cmluZztcbiAgcnVudGltZToge1trOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9O1xufVxuXG4vLyBmdW5jdGlvbiBjcmVhdGVSb2xlUHJvZmlsZShhY2NvdW50OiBBY2NvdW50Q29uZmlnKSB7XG4vLyAgIHJldHVybiBbXG4vLyAgICAgYGF3cyAtLXByb2ZpbGUgdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0gY29uZmlndXJlIHNldCBzb3VyY2VfcHJvZmlsZSBkYW1hZGRlbjg4YCxcbi8vICAgICBgYXdzIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSBjb25maWd1cmUgc2V0IHJvbGVfYXJuICdhcm46YXdzOmlhbTo6JHthY2NvdW50LmlkfTpyb2xlL3VuaW1lZC0ke2FjY291bnQuc3RhZ2V9J2AsXG4vLyAgICAgYGF3cyAtLXByb2ZpbGUgdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0gY29uZmlndXJlIHNldCByZWdpb24gJHtBbGxvd2VkUmVnaW9ucy5ldUNlbnRyYWwxfWAsXG4vLyAgIF07XG4vLyB9XG5cbmV4cG9ydCBjbGFzcyBVSVBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nLCBwcm9wczogVUlQaXBlbGluZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihhcHAsIGlkLCBwcm9wcyk7XG5cbiAgICBUYWcuYWRkKHRoaXMsICdGcm9udGVuZFBpcGVsaW5lJywgdGhpcy5zdGFja05hbWUpO1xuXG4gICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgUGlwZWxpbmUodGhpcywgYCR7dGhpcy5zdGFja05hbWV9LXBpcGVsaW5lYCwge1xuICAgICAgcGlwZWxpbmVOYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tcGlwZWxpbmVgLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2RrRGVwbG95Um9sZSA9IG5ldyBSb2xlKHRoaXMsICdjcmVhdGVJbnN0YW5jZUJ1aWxkUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2NvZGVidWlsZC5hbWF6b25hd3MuY29tJyksICAgLy8gcmVxdWlyZWRcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICAvLyBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaExvZ3NGdWxsQWNjZXNzJyksXG4gICAgICAgIC8vIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25TM0Z1bGxBY2Nlc3MnKSxcbiAgICAgICAgLy8gTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FXU0Nsb3VkRm9ybWF0aW9uRnVsbEFjY2VzcycpLFxuICAgICAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQWRtaW5pc3RyYXRvckFjY2VzcycpLCAvLyBUT0RPIGZpbmQgb3V0IHRoZSByaWdodCBwZXJtaXNzaW9uc1xuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNka0J1aWxkID0gbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tYnVpbGRgLCB7XG4gICAgICBwcm9qZWN0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LWJ1aWxkYCxcbiAgICAgIHJvbGU6IGNka0RlcGxveVJvbGUsXG4gICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgZW52OiB7ICdnaXQtY3JlZGVudGlhbC1oZWxwZXInOiAneWVzJyB9LFxuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgJ3J1bnRpbWUtdmVyc2lvbnMnOlxuICAgICAgICAgICAgcHJvcHMucnVudGltZSxcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICAgICAgYG5wbSBpbnN0YWxsIC1nIGF3cy1jZGtAJHtwcm9wcy5jZGtWZXJzaW9ufWAsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICducG0gcnVuIGJ1aWxkJyxcbiAgICAgICAgICAgICAgJ2xzIC1sYScsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcG9zdF9idWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6XG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgLy8gJ25wbSBydW4gdGVzdCcsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAvLyBhcnRpZmFjdHM6IHtcbiAgICAgICAgLy8gICAnYmFzZS1kaXJlY3RvcnknOiAnYnVpbGQnLFxuICAgICAgICAvLyAgIGZpbGVzOiBbXG4gICAgICAgIC8vICAgICAnKiovKicsXG4gICAgICAgIC8vICAgXSxcbiAgICAgICAgLy8gfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzRfMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cblxuICAgIGNvbnN0IGNka0RlcGxveUJ1aWxkID0gbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tZGVwbG95QnVpbGRgLCB7XG4gICAgICBwcm9qZWN0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LWRlcGxveUJ1aWxkYCxcbiAgICAgIHJvbGU6IGNka0RlcGxveVJvbGUsXG4gICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICBkZXBsb3llckFjY2Vzc0tleUlkOiB7XG4gICAgICAgICAgdmFsdWU6ICdkZXBsb3llci1hY2Nlc3Mta2V5LWlkJyxcbiAgICAgICAgICB0eXBlOiBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLlBBUkFNRVRFUl9TVE9SRSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVwbG95ZXJTZWNyZXRBY2Nlc3NLZXk6IHtcbiAgICAgICAgICB2YWx1ZTogJ2RlcGxveWVyLXNlY3JldC1hY2Nlc3Mta2V5JyxcbiAgICAgICAgICB0eXBlOiBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLlBBUkFNRVRFUl9TVE9SRSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgZW52OiB7ICdnaXQtY3JlZGVudGlhbC1oZWxwZXInOiAneWVzJyB9LFxuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgJ3J1bnRpbWUtdmVyc2lvbnMnOiBwcm9wcy5ydW50aW1lLFxuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2F3cyAtLXByb2ZpbGUgZGFtYWRkZW44OCBjb25maWd1cmUgc2V0IGF3c19hY2Nlc3Nfa2V5X2lkICRkZXBsb3llckFjY2Vzc0tleUlkJyxcbiAgICAgICAgICAgICAgJ2F3cyAtLXByb2ZpbGUgZGFtYWRkZW44OCBjb25maWd1cmUgc2V0IGF3c19zZWNyZXRfYWNjZXNzX2tleSAkZGVwbG95ZXJTZWNyZXRBY2Nlc3NLZXknLFxuICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgIGBhd3MgLS1wcm9maWxlIGRlZmF1bHQgY29uZmlndXJlIHNldCByZWdpb24gJHtwcm9wcy5lbnYucmVnaW9ufWAsXG4gICAgICAgICAgICAgIC8vIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgLy8gLi4uY3JlYXRlUm9sZVByb2ZpbGUoZGV2QWNjb3VudCksXG4gICAgICAgICAgICAgIC8vIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgLy8gLi4uY3JlYXRlUm9sZVByb2ZpbGUocWFBY2NvdW50KSxcbiAgICAgICAgICAgICAgLy8gLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAvLyAuLi5jcmVhdGVSb2xlUHJvZmlsZShwcm9kQWNjb3VudCksXG4gICAgICAgICAgICAgICducG0gaW5zdGFsbCcsXG4gICAgICAgICAgICAgICdjZCBjZGsgJiYgbnBtIGluc3RhbGwgJiYgY2QgLi4nLFxuICAgICAgICAgICAgICBgbnBtIGluc3RhbGwgLWcgYXdzLWNka0Ake3Byb3BzLmNka1ZlcnNpb259YCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ25wbSBydW4gYnVpbGQnLFxuICAgICAgICAgICAgICAvLyAnY2QgYnVpbGQgJiYgbnBtIGluc3RhbGwgLS1vbmx5PXByb2R1Y3Rpb24gJiYgY2QgLi4nLFxuICAgICAgICAgICAgICAnbHMgLWxhJyxcbiAgICAgICAgICAgICAgJ2VjaG8gXCJydW46ICRDREtfQ09NTUFORFwiJyxcbiAgICAgICAgICAgICAgJ2V2YWwgJENES19DT01NQU5EJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ2J1aWxkJyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgJyoqLyonLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCk7XG4gICAgY29uc3QgY2RrQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoYCR7dGhpcy5zdGFja05hbWV9LWNkay1idWlsZC1vdXRwdXRgKTtcblxuICAgIC8vIGNvbnN0IG9hdXRoID0gU3RyaW5nUGFyYW1ldGVyLnZhbHVlRm9yU2VjdXJlU3RyaW5nUGFyYW1ldGVyKFxuICAgIC8vICAgdGhpcywgJ211bGxlcjg4LWdpdGh1Yi10b2tlbicsIDEpO1xuICAgIGNvbnN0IG9hdXRoID0gU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2FsZmNkaycsIHtcbiAgICAgIGpzb25GaWVsZDogJ211bGxlcjg4LWdpdGh1Yi10b2tlbicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBnaXRTb3VyY2UgPSBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRodWJTb3VyY2UnLFxuICAgICAgYnJhbmNoOiBwcm9wcy5icmFuY2gsXG4gICAgICBvd25lcjogJ21tdWxsZXI4OCcsXG4gICAgICByZXBvOiAnYWxmLWNkay11aScsXG4gICAgICBvYXV0aFRva2VuOiBvYXV0aCxcbiAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgIH0pO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgZ2l0U291cmNlLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogJ0Nka0xpbnRBbmRCdWlsZCcsXG4gICAgICAgICAgcHJvamVjdDogY2RrQnVpbGQsXG4gICAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgICBvdXRwdXRzOiBbY2RrQnVpbGRPdXRwdXRdLFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbi8vIHRvZG86IGFkZCBkZXZBY2NvdW50IGxhdGVyXG4gICAgZm9yIChjb25zdCBhY2NvdW50IG9mIFtwcm9kQWNjb3VudF0pIHtcbiAgICAgIGNvbnN0IGRlcGxveVN0YWdlID0gcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgICBzdGFnZU5hbWU6IGBEZXBsb3lTdGFnZSR7YWNjb3VudC5zdGFnZVswXS50b1VwcGVyQ2FzZSgpfSR7YWNjb3VudC5zdGFnZS5zbGljZSgxKX1gLFxuICAgICAgfSk7XG5cbiAgICAgIGRlcGxveVN0YWdlLmFkZEFjdGlvbihuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgICBDREtfQ09NTUFORDogeyB2YWx1ZTogYGNkIGNkayAmJiBjZGsgZGlmZiAnJHt0aGlzLnN0YWNrTmFtZX0tJHthY2NvdW50LnN0YWdlfScgLS1wcm9maWxlIHVuaW1lZC0ke2FjY291bnQuc3RhZ2V9IHx8IHRydWVgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHByb2plY3Q6IGNka0RlcGxveUJ1aWxkLFxuICAgICAgICBhY3Rpb25OYW1lOiAnQ3JlYXRlRGlmZicsXG4gICAgICAgIHJ1bk9yZGVyOiAxLFxuICAgICAgfSkpO1xuXG4gICAgICAvLyBJZiBub3QgaW4gZGV2IHN0YWdlLCBhc2sgZm9yIGFwcHJvdmVtZW50IGJlZm9yZSBkZXBsb3lpbmdcbiAgICAgIC8vIGlmIChhY2NvdW50LmlkICE9PSBkZXZBY2NvdW50LmlkKSB7XG4gICAgICAvLyAgIGRlcGxveVN0YWdlLmFkZEFjdGlvbihuZXcgTWFudWFsQXBwcm92YWxBY3Rpb24oe1xuICAgICAgLy8gICAgIGFjdGlvbk5hbWU6ICdBcHByb3ZlRGlmZicsXG4gICAgICAvLyAgICAgcnVuT3JkZXI6IDIsXG4gICAgICAvLyAgIH0pKTtcbiAgICAgIC8vIH1cblxuICAgICAgZGVwbG95U3RhZ2UuYWRkQWN0aW9uKG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAgIC8vIENES19DT01NQU5EOiB7IHZhbHVlOiBgY2RrIGRlcGxveSAnJHt0aGlzLnN0YWNrTmFtZX0tJHthY2NvdW50LnN0YWdlfScgLS1yZXF1aXJlLWFwcHJvdmFsIG5ldmVyIC0tcHJvZmlsZSAke2FjY291bnQuc3RhZ2V9YCB9LFxuICAgICAgICAgIENES19DT01NQU5EOiB7IHZhbHVlOiBgbWFrZSBjZGtkZXBsb3kke2FjY291bnQuc3RhZ2V9YCB9LFxuICAgICAgICB9LFxuICAgICAgICBwcm9qZWN0OiBjZGtEZXBsb3lCdWlsZCxcbiAgICAgICAgYWN0aW9uTmFtZTogJ0RlcGxveUJ1aWxkJyxcbiAgICAgICAgcnVuT3JkZXI6IDMsXG4gICAgICB9KSk7XG4gICAgfVxuICB9XG59XG4iXX0=
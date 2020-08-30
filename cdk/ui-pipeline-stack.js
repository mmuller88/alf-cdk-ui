"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendPipelineStack = void 0;
const aws_codecommit_1 = require("@aws-cdk/aws-codecommit");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
const account_config_1 = require("infrastructure-aws/lib/account-config");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
function createRoleProfile(account) {
    return [
        `aws --profile unimed-${account.stage} configure set source_profile default`,
        `aws --profile unimed-${account.stage} configure set role_arn 'arn:aws:iam::${account.id}:role/unimed-${account.stage}'`,
        `aws --profile unimed-${account.stage} configure set region ${account_config_1.AllowedRegions.euCentral1}`,
    ];
}
class FrontendPipelineStack extends core_1.Stack {
    constructor(app, id, props) {
        super(app, id, props);
        core_1.Tag.add(this, 'FrontendPipeline', this.stackName);
        const pipeline = new aws_codepipeline_1.Pipeline(this, `${this.stackName}-pipeline`, {
            pipelineName: `${this.stackName}-pipeline`,
        });
        const code = aws_codecommit_1.Repository.fromRepositoryName(this, `${this.stackName}-repo`, props.repositoryName);
        const cdkDeployRole = new aws_iam_1.Role(this, 'createInstanceBuildRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('codebuild.amazonaws.com'),
            managedPolicies: [
                // ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
                // ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                // ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
            ],
        });
        // cdkDeployRole.addToPolicy(new PolicyStatement({
        //   resources: ['*'],
        //   actions: ['codebuild:*', 'logs:*', 'cloudformation:*', 's3:*', 'sns:*', 'sts:AssumeRole', 'codecommit:*'],
        // }));
        // iam policy to push to S3 if it is a frontend build
        // cdkDeployRole.addToPolicy(
        //     new PolicyStatement({
        //       effect: Effect.ALLOW,
        //       resources: [props.bucketArn, `${props.bucketArn}/*`],
        //       actions: [
        //         's3:GetBucket*',
        //         's3:List*',
        //         's3:GetObject*',
        //         's3:DeleteObject',
        //         's3:PutObject',
        //       ],
        //     })
        // );
        // // iam policy to invalidate cloudfront dsitribution's cache
        // cdkDeployRole.addToPolicy(
        //     new PolicyStatement({
        //       effect: Effect.ALLOW,
        //       resources: ['*'],
        //       actions: [
        //         'cloudfront:CreateInvalidation',
        //         'cloudfront:GetDistribution*',
        //         'cloudfront:GetInvalidation',
        //         'cloudfront:ListInvalidations',
        //         'cloudfront:ListDistributions',
        //       ],
        //     })
        // );
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
                            'aws --profile default configure set aws_access_key_id $deployerAccessKeyId',
                            'aws --profile default configure set aws_secret_access_key $deployerSecretAccessKey',
                            // @ts-ignore
                            `aws --profile default configure set region ${props.env.region}`,
                            // @ts-ignore
                            ...createRoleProfile(account_config_1.devAccount),
                            // @ts-ignore
                            ...createRoleProfile(account_config_1.qaAccount),
                            // @ts-ignore
                            ...createRoleProfile(account_config_1.prodAccount),
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
        const codeCommitSourceAction = new aws_codepipeline_actions_1.CodeCommitSourceAction({
            actionName: 'CodeCommitSource',
            branch: props.branch,
            repository: code,
            output: sourceOutput,
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                codeCommitSourceAction,
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
        for (const account of [account_config_1.devAccount, account_config_1.qaAccount, account_config_1.prodAccount]) {
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
            if (account.id !== account_config_1.devAccount.id) {
                deployStage.addAction(new aws_codepipeline_actions_1.ManualApprovalAction({
                    actionName: 'ApproveDiff',
                    runOrder: 2,
                }));
            }
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
exports.FrontendPipelineStack = FrontendPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1waXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0REFBcUQ7QUFDckQsZ0VBQStEO0FBQy9ELGdGQUFrSDtBQUNsSCx3Q0FBNEQ7QUFDNUQsMEVBQTBIO0FBQzFILDhDQUF5RTtBQUN6RSwwREFBbUg7QUFlbkgsU0FBUyxpQkFBaUIsQ0FBQyxPQUFzQjtJQUMvQyxPQUFPO1FBQ0wsd0JBQXdCLE9BQU8sQ0FBQyxLQUFLLHVDQUF1QztRQUM1RSx3QkFBd0IsT0FBTyxDQUFDLEtBQUsseUNBQXlDLE9BQU8sQ0FBQyxFQUFFLGdCQUFnQixPQUFPLENBQUMsS0FBSyxHQUFHO1FBQ3hILHdCQUF3QixPQUFPLENBQUMsS0FBSyx5QkFBeUIsK0JBQWMsQ0FBQyxVQUFVLEVBQUU7S0FDMUYsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFhLHFCQUFzQixTQUFRLFlBQUs7SUFDOUMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWlDO1FBQ2pFLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLFVBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO1lBQ2hFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLFdBQVc7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsTUFBTSxJQUFJLEdBQUcsMkJBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxPQUFPLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRWpHLE1BQU0sYUFBYSxHQUFHLElBQUksY0FBSSxD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QUFZO2dCQUNuQixvQkFBb0IsRUFBRTtvQkFDcEIsaUlBQWlJO29CQUNqSSxXQUFXLEVBQUUsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRTtpQkFDekQ7Z0JBQ0QsT0FBTyxFQUFFLGNBQWM7Z0JBQ3ZCLFVBQVUsRUFBRSxhQUFhO2dCQUN6QixRQUFRLEVBQUUsQ0FBQzthQUNaLENBQUMsQ0FBQyxDQUFDO1NBQ0w7SUFDSCxDQUFDO0NBQ0Y7QUEzTkQsc0RBMk5DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwb3NpdG9yeSB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2RlY29tbWl0JztcbmltcG9ydCB7IFBpcGVsaW5lLCBBcnRpZmFjdCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0IHsgQ29kZUNvbW1pdFNvdXJjZUFjdGlvbiwgQ29kZUJ1aWxkQWN0aW9uLCBNYW51YWxBcHByb3ZhbEFjdGlvbiB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucyc7XG5pbXBvcnQgeyBBcHAsIFN0YWNrLCBTdGFja1Byb3BzLCBUYWcgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IGRldkFjY291bnQsIEFsbG93ZWRSZWdpb25zLCBxYUFjY291bnQsIHByb2RBY2NvdW50LCBBY2NvdW50Q29uZmlnIH0gZnJvbSAnaW5mcmFzdHJ1Y3R1cmUtYXdzL2xpYi9hY2NvdW50LWNvbmZpZyc7XG5pbXBvcnQgeyBTZXJ2aWNlUHJpbmNpcGFsLCBSb2xlLCBNYW5hZ2VkUG9saWN5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgeyBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLCBQaXBlbGluZVByb2plY3QsIEJ1aWxkU3BlYywgTGludXhCdWlsZEltYWdlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRnJvbnRlbmRQaXBlbGluZVN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgY2RrVmVyc2lvbjogc3RyaW5nO1xuICAvLyBkb21haW5OYW1lOiBzdHJpbmc7XG4gIC8vIGJ1Y2tldE5hbWU6IHN0cmluZztcbiAgLy8gYnVja2V0QXJuOiBzdHJpbmc7XG4gIC8vIGNsb3VkZnJvbnRJZDogc3RyaW5nO1xuICByZXBvc2l0b3J5TmFtZTogc3RyaW5nO1xuICBicmFuY2g6IHN0cmluZztcbiAgcnVudGltZToge1trOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9O1xuICBza2lwSW5mcmFzdHJ1Y3R1cmVEZXBsb3k/OiBib29sZWFuO1xuICAvLyBkZXBsb3lCdWNrZXROYW1lOiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJvbGVQcm9maWxlKGFjY291bnQ6IEFjY291bnRDb25maWcpIHtcbiAgcmV0dXJuIFtcbiAgICBgYXdzIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSBjb25maWd1cmUgc2V0IHNvdXJjZV9wcm9maWxlIGRlZmF1bHRgLFxuICAgIGBhd3MgLS1wcm9maWxlIHVuaW1lZC0ke2FjY291bnQuc3RhZ2V9IGNvbmZpZ3VyZSBzZXQgcm9sZV9hcm4gJ2Fybjphd3M6aWFtOjoke2FjY291bnQuaWR9OnJvbGUvdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0nYCxcbiAgICBgYXdzIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSBjb25maWd1cmUgc2V0IHJlZ2lvbiAke0FsbG93ZWRSZWdpb25zLmV1Q2VudHJhbDF9YCxcbiAgXTtcbn1cblxuZXhwb3J0IGNsYXNzIEZyb250ZW5kUGlwZWxpbmVTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzOiBGcm9udGVuZFBpcGVsaW5lU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIFRhZy5hZGQodGhpcywgJ0Zyb250ZW5kUGlwZWxpbmUnLCB0aGlzLnN0YWNrTmFtZSk7XG5cbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBQaXBlbGluZSh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tcGlwZWxpbmVgLCB7XG4gICAgICBwaXBlbGluZU5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1waXBlbGluZWAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjb2RlID0gUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUodGhpcywgYCR7dGhpcy5zdGFja05hbWV9LXJlcG9gLCBwcm9wcy5yZXBvc2l0b3J5TmFtZSk7XG5cbiAgICBjb25zdCBjZGtEZXBsb3lSb2xlID0gbmV3IFJvbGUodGhpcywgJ2NyZWF0ZUluc3RhbmNlQnVpbGRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnY29kZWJ1aWxkLmFtYXpvbmF3cy5jb20nKSwgICAvLyByZXF1aXJlZFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIC8vIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoTG9nc0Z1bGxBY2Nlc3MnKSxcbiAgICAgICAgLy8gTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblMzRnVsbEFjY2VzcycpLFxuICAgICAgICAvLyBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTQ2xvdWRGb3JtYXRpb25GdWxsQWNjZXNzJyksXG4gICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBZG1pbmlzdHJhdG9yQWNjZXNzJyksIC8vIFRPRE8gZmluZCBvdXQgdGhlIHJpZ2h0IHBlcm1pc3Npb25zXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gY2RrRGVwbG95Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAvLyAgIHJlc291cmNlczogWycqJ10sXG4gICAgLy8gICBhY3Rpb25zOiBbJ2NvZGVidWlsZDoqJywgJ2xvZ3M6KicsICdjbG91ZGZvcm1hdGlvbjoqJywgJ3MzOionLCAnc25zOionLCAnc3RzOkFzc3VtZVJvbGUnLCAnY29kZWNvbW1pdDoqJ10sXG4gICAgLy8gfSkpO1xuXG4gICAgLy8gaWFtIHBvbGljeSB0byBwdXNoIHRvIFMzIGlmIGl0IGlzIGEgZnJvbnRlbmQgYnVpbGRcbiAgICAvLyBjZGtEZXBsb3lSb2xlLmFkZFRvUG9saWN5KFxuICAgIC8vICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAvLyAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAvLyAgICAgICByZXNvdXJjZXM6IFtwcm9wcy5idWNrZXRBcm4sIGAke3Byb3BzLmJ1Y2tldEFybn0vKmBdLFxuICAgIC8vICAgICAgIGFjdGlvbnM6IFtcbiAgICAvLyAgICAgICAgICdzMzpHZXRCdWNrZXQqJyxcbiAgICAvLyAgICAgICAgICdzMzpMaXN0KicsXG4gICAgLy8gICAgICAgICAnczM6R2V0T2JqZWN0KicsXG4gICAgLy8gICAgICAgICAnczM6RGVsZXRlT2JqZWN0JyxcbiAgICAvLyAgICAgICAgICdzMzpQdXRPYmplY3QnLFxuICAgIC8vICAgICAgIF0sXG4gICAgLy8gICAgIH0pXG4gICAgLy8gKTtcblxuICAgIC8vIC8vIGlhbSBwb2xpY3kgdG8gaW52YWxpZGF0ZSBjbG91ZGZyb250IGRzaXRyaWJ1dGlvbidzIGNhY2hlXG4gICAgLy8gY2RrRGVwbG95Um9sZS5hZGRUb1BvbGljeShcbiAgICAvLyAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgLy8gICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgLy8gICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAvLyAgICAgICBhY3Rpb25zOiBbXG4gICAgLy8gICAgICAgICAnY2xvdWRmcm9udDpDcmVhdGVJbnZhbGlkYXRpb24nLFxuICAgIC8vICAgICAgICAgJ2Nsb3VkZnJvbnQ6R2V0RGlzdHJpYnV0aW9uKicsXG4gICAgLy8gICAgICAgICAnY2xvdWRmcm9udDpHZXRJbnZhbGlkYXRpb24nLFxuICAgIC8vICAgICAgICAgJ2Nsb3VkZnJvbnQ6TGlzdEludmFsaWRhdGlvbnMnLFxuICAgIC8vICAgICAgICAgJ2Nsb3VkZnJvbnQ6TGlzdERpc3RyaWJ1dGlvbnMnLFxuICAgIC8vICAgICAgIF0sXG4gICAgLy8gICAgIH0pXG4gICAgLy8gKTtcblxuICAgIGNvbnN0IGNka0J1aWxkID0gbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tYnVpbGRgLCB7XG4gICAgICBwcm9qZWN0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LWJ1aWxkYCxcbiAgICAgIHJvbGU6IGNka0RlcGxveVJvbGUsXG4gICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgZW52OiB7ICdnaXQtY3JlZGVudGlhbC1oZWxwZXInOiAneWVzJyB9LFxuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgJ3J1bnRpbWUtdmVyc2lvbnMnOlxuICAgICAgICAgICAgcHJvcHMucnVudGltZSxcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICAgICAgYG5wbSBpbnN0YWxsIC1nIGF3cy1jZGtAJHtwcm9wcy5jZGtWZXJzaW9ufWAsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICducG0gcnVuIGJ1aWxkJyxcbiAgICAgICAgICAgICAgJ2xzIC1sYScsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcG9zdF9idWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6XG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgLy8gJ25wbSBydW4gdGVzdCcsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAvLyBhcnRpZmFjdHM6IHtcbiAgICAgICAgLy8gICAnYmFzZS1kaXJlY3RvcnknOiAnYnVpbGQnLFxuICAgICAgICAvLyAgIGZpbGVzOiBbXG4gICAgICAgIC8vICAgICAnKiovKicsXG4gICAgICAgIC8vICAgXSxcbiAgICAgICAgLy8gfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzRfMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cblxuICAgIGNvbnN0IGNka0RlcGxveUJ1aWxkID0gbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tZGVwbG95QnVpbGRgLCB7XG4gICAgICBwcm9qZWN0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LWRlcGxveUJ1aWxkYCxcbiAgICAgIHJvbGU6IGNka0RlcGxveVJvbGUsXG4gICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICBkZXBsb3llckFjY2Vzc0tleUlkOiB7XG4gICAgICAgICAgdmFsdWU6ICdkZXBsb3llci1hY2Nlc3Mta2V5LWlkJyxcbiAgICAgICAgICB0eXBlOiBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLlBBUkFNRVRFUl9TVE9SRSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVwbG95ZXJTZWNyZXRBY2Nlc3NLZXk6IHtcbiAgICAgICAgICB2YWx1ZTogJ2RlcGxveWVyLXNlY3JldC1hY2Nlc3Mta2V5JyxcbiAgICAgICAgICB0eXBlOiBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLlBBUkFNRVRFUl9TVE9SRSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgZW52OiB7ICdnaXQtY3JlZGVudGlhbC1oZWxwZXInOiAneWVzJyB9LFxuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgJ3J1bnRpbWUtdmVyc2lvbnMnOiBwcm9wcy5ydW50aW1lLFxuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2F3cyAtLXByb2ZpbGUgZGVmYXVsdCBjb25maWd1cmUgc2V0IGF3c19hY2Nlc3Nfa2V5X2lkICRkZXBsb3llckFjY2Vzc0tleUlkJyxcbiAgICAgICAgICAgICAgJ2F3cyAtLXByb2ZpbGUgZGVmYXVsdCBjb25maWd1cmUgc2V0IGF3c19zZWNyZXRfYWNjZXNzX2tleSAkZGVwbG95ZXJTZWNyZXRBY2Nlc3NLZXknLFxuICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgIGBhd3MgLS1wcm9maWxlIGRlZmF1bHQgY29uZmlndXJlIHNldCByZWdpb24gJHtwcm9wcy5lbnYucmVnaW9ufWAsXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgLi4uY3JlYXRlUm9sZVByb2ZpbGUoZGV2QWNjb3VudCksXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgLi4uY3JlYXRlUm9sZVByb2ZpbGUocWFBY2NvdW50KSxcbiAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAuLi5jcmVhdGVSb2xlUHJvZmlsZShwcm9kQWNjb3VudCksXG4gICAgICAgICAgICAgICducG0gaW5zdGFsbCcsXG4gICAgICAgICAgICAgICdjZCBjZGsgJiYgbnBtIGluc3RhbGwgJiYgY2QgLi4nLFxuICAgICAgICAgICAgICBgbnBtIGluc3RhbGwgLWcgYXdzLWNka0Ake3Byb3BzLmNka1ZlcnNpb259YCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ25wbSBydW4gYnVpbGQnLFxuICAgICAgICAgICAgICAvLyAnY2QgYnVpbGQgJiYgbnBtIGluc3RhbGwgLS1vbmx5PXByb2R1Y3Rpb24gJiYgY2QgLi4nLFxuICAgICAgICAgICAgICAnbHMgLWxhJyxcbiAgICAgICAgICAgICAgJ2VjaG8gXCJydW46ICRDREtfQ09NTUFORFwiJyxcbiAgICAgICAgICAgICAgJ2V2YWwgJENES19DT01NQU5EJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ2J1aWxkJyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgJyoqLyonLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCk7XG4gICAgY29uc3QgY2RrQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoYCR7dGhpcy5zdGFja05hbWV9LWNkay1idWlsZC1vdXRwdXRgKTtcblxuICAgIGNvbnN0IGNvZGVDb21taXRTb3VyY2VBY3Rpb24gPSBuZXcgQ29kZUNvbW1pdFNvdXJjZUFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnQ29kZUNvbW1pdFNvdXJjZScsXG4gICAgICBicmFuY2g6IHByb3BzLmJyYW5jaCxcbiAgICAgIHJlcG9zaXRvcnk6IGNvZGUsXG4gICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICB9KTtcblxuICAgIHBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIGNvZGVDb21taXRTb3VyY2VBY3Rpb24sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnQ2RrTGludEFuZEJ1aWxkJyxcbiAgICAgICAgICBwcm9qZWN0OiBjZGtCdWlsZCxcbiAgICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICAgIG91dHB1dHM6IFtjZGtCdWlsZE91dHB1dF0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcblxuLy8gdG9kbzogYWRkIGRldkFjY291bnQgbGF0ZXJcbiAgICBmb3IgKGNvbnN0IGFjY291bnQgb2YgW2RldkFjY291bnQsIHFhQWNjb3VudCwgcHJvZEFjY291bnRdKSB7XG4gICAgICBjb25zdCBkZXBsb3lTdGFnZSA9IHBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgICAgc3RhZ2VOYW1lOiBgRGVwbG95U3RhZ2Uke2FjY291bnQuc3RhZ2VbMF0udG9VcHBlckNhc2UoKX0ke2FjY291bnQuc3RhZ2Uuc2xpY2UoMSl9YCxcbiAgICAgIH0pO1xuXG4gICAgICBkZXBsb3lTdGFnZS5hZGRBY3Rpb24obmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgICAgQ0RLX0NPTU1BTkQ6IHsgdmFsdWU6IGBjZCBjZGsgJiYgY2RrIGRpZmYgJyR7dGhpcy5zdGFja05hbWV9LSR7YWNjb3VudC5zdGFnZX0nIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSB8fCB0cnVlYCB9LFxuICAgICAgICB9LFxuICAgICAgICBwcm9qZWN0OiBjZGtEZXBsb3lCdWlsZCxcbiAgICAgICAgYWN0aW9uTmFtZTogJ0NyZWF0ZURpZmYnLFxuICAgICAgICBydW5PcmRlcjogMSxcbiAgICAgIH0pKTtcblxuICAgICAgLy8gSWYgbm90IGluIGRldiBzdGFnZSwgYXNrIGZvciBhcHByb3ZlbWVudCBiZWZvcmUgZGVwbG95aW5nXG4gICAgICBpZiAoYWNjb3VudC5pZCAhPT0gZGV2QWNjb3VudC5pZCkge1xuICAgICAgICBkZXBsb3lTdGFnZS5hZGRBY3Rpb24obmV3IE1hbnVhbEFwcHJvdmFsQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnQXBwcm92ZURpZmYnLFxuICAgICAgICAgIHJ1bk9yZGVyOiAyLFxuICAgICAgICB9KSk7XG4gICAgICB9XG5cbiAgICAgIGRlcGxveVN0YWdlLmFkZEFjdGlvbihuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgICAvLyBDREtfQ09NTUFORDogeyB2YWx1ZTogYGNkayBkZXBsb3kgJyR7dGhpcy5zdGFja05hbWV9LSR7YWNjb3VudC5zdGFnZX0nIC0tcmVxdWlyZS1hcHByb3ZhbCBuZXZlciAtLXByb2ZpbGUgJHthY2NvdW50LnN0YWdlfWAgfSxcbiAgICAgICAgICBDREtfQ09NTUFORDogeyB2YWx1ZTogYG1ha2UgY2RrZGVwbG95JHthY2NvdW50LnN0YWdlfWAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcHJvamVjdDogY2RrRGVwbG95QnVpbGQsXG4gICAgICAgIGFjdGlvbk5hbWU6ICdEZXBsb3lCdWlsZCcsXG4gICAgICAgIHJ1bk9yZGVyOiAzLFxuICAgICAgfSkpO1xuICAgIH1cbiAgfVxufVxuIl19
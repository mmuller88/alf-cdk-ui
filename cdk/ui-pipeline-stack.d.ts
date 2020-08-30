import { App, Stack, StackProps } from '@aws-cdk/core';
export interface FrontendPipelineStackProps extends StackProps {
    cdkVersion: string;
    repositoryName: string;
    branch: string;
    runtime: {
        [k: string]: string | number;
    };
    skipInfrastructureDeploy?: boolean;
}
export declare class FrontendPipelineStack extends Stack {
    constructor(app: App, id: string, props: FrontendPipelineStackProps);
}

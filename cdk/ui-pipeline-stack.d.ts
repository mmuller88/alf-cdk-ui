import { App, Stack, StackProps } from '@aws-cdk/core';
export interface UIPipelineStackProps extends StackProps {
    cdkVersion: string;
    repositoryName: string;
    branch: string;
    runtime: {
        [k: string]: string | number;
    };
}
export declare class UIPipelineStack extends Stack {
    constructor(app: App, id: string, props: UIPipelineStackProps);
}

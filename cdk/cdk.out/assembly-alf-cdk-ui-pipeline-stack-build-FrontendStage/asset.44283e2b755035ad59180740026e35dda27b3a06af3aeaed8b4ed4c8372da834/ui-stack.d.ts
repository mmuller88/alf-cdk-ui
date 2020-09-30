import { StackProps, Construct } from '@aws-cdk/core';
import core = require('@aws-cdk/core');
export interface UIStackProps extends StackProps {
    stage: string;
    acmCertRef: string;
    domainName: string;
    subDomain: string;
}
export declare class UIStack extends core.Stack {
    constructor(scope: Construct, id: string, props: UIStackProps);
}

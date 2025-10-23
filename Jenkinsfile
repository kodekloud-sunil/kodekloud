pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    stages{
        stage ('Install Dependencies'){
            steps {
                sh 'npm install --no-audit'
            }
        }
        stage ('Dependencies Audit') {
            parallel {
                stage('default audit') {
                    steps {
                        sh 'npm audit --audit-level=critical'
                    }
                }
                stage ('OWASP Audit'){
                    steps {
                        dependencyCheck additionalArguments: '''
                            --scan "./"
                            --out "./"
                            --format "ALL"
                            --disableYarnAudit
                            --prettyPrint''', odcInstallation: 'dep-check-10'
                    }
                }
            }
        }
        stage ('Run Tests'){
            withCredentials([aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws-aws-iam-s3', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                steps {
                    sh 'npm test'
                }
            }
        }
    }
}
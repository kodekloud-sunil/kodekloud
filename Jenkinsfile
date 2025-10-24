pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    environment {
        MONGO_URI = 'mongodb+srv://supercluster.d83jj.mongodb.net/superData'
        MOCHA_CHECKS_API = 'false'
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
                        dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml', stopBuild: false

                        publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-jenkins.html', reportName: 'Dependency check HTML Report', reportTitles: '', useWrapperFileDirectly: true])

                        junit allowEmptyResults: true, keepProperties: true, testResults: 'dependency-check-junit.xml'
                    }
                }
            }
        }
        stage ('Run Tests'){
            steps {
                withCredentials([usernamePassword(credentialsId: 'mongodb-cred', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {
                    catchError(buildResult: 'SUCCESS') {
                        sh 'npm test'
                    }
                }
            }
        }
        stage ('Coverage') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'mongodb-cred', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {
                    catchError(buildResult: 'UNSTABLE') {
                        sh 'npm run coverage'
                    }
                }
            }
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code coverage Report', reportTitles: '', useWrapperFileDirectly: true])
        }
    }
}
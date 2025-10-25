pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    environment {
        MONGO_URI = 'mongodb+srv://supercluster.d83jj.mongodb.net/superData'
        MOCHA_CHECKS_API = 'false'
        MONGO_USERNAME = credentials('mongo-username')
        MONGO_PASSWORD = credentials('mongo-password')
        SONAR_HOME = tool 'sonar-scanner'
        CONTAINER_NAME = 'sunilpolaki/solar-ap.*'
    }
    stages{
        // stage ('Install Dependencies'){
        //     steps {
        //         sh 'npm install --no-audit'
        //     }
        // }
        // stage ('Dependencies Audit') {
        //     parallel {
        //         stage('default audit') {
        //             steps {
        //                 sh 'npm audit --audit-level=critical'
        //             }
        //         }
        //         stage ('OWASP Audit'){
        //             steps {
        //                 dependencyCheck additionalArguments: '''
        //                     --scan "./"
        //                     --out "./"
        //                     --format "ALL"
        //                     --disableYarnAudit
        //                     --prettyPrint''', odcInstallation: 'dep-check-10'
        //                 dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml', stopBuild: false

        //                 publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-jenkins.html', reportName: 'Dependency check HTML Report', reportTitles: '', useWrapperFileDirectly: true])

        //                 junit allowEmptyResults: true, keepProperties: true, testResults: 'dependency-check-junit.xml'
        //             }
        //         }
        //     }
        // }
        // stage ('Run Tests'){
        //     steps {
        //         catchError(buildResult: 'SUCCESS') {
        //             sh 'npm test'
        //         }
        //     }
        // }
        // stage ('Coverage') {
        //     steps {
        //         catchError(buildResult: 'UNSTABLE') {
        //             sh 'npm run coverage'
        //         }
        //         publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code coverage Report', reportTitles: '', useWrapperFileDirectly: true])
        //     }
        // }
        // stage ('SAST - Sonarqube'){
        //     steps {
        //         timeout(time: 60, unit: 'SECONDS') {
        //             withSonarQubeEnv ('sunil-sonar-server') {
        //                 sh '''
        //                     $SONAR_HOME/bin/sonar-scanner \
        //                         -Dsonar.projectKey=kodekloud \
        //                         -Dsonar.sources=app.js \
        //                         -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info \
        //                 '''
        //             }
        //         }
        //         waitForQualityGate abortPipeline: true
        //     }
        // }
        stage ('Docker Build'){
            steps {
                sh 'docker build -t sunilpolaki/solar-app:$GIT_COMMIT .'
            }
        }
        stage('TRIVY Scan') {
            steps {
                sh '''
                    trivy image sunilpolaki/solar-app:$GIT_COMMIT \
                        --severity LOW,MEDIUM \
                        --quiet \
                        --exit-code 0 \
                        --format json -o trivy-image-medium-report.json

                    trivy image sunilpolaki/solar-app:$GIT_COMMIT \
                        --severity HIGH,CRITICAL \
                        --quiet \
                        --exit-code 0 \
                        --format json -o trivy-image-critical-report.json
                '''
            }
            post{
                always{
                    sh '''
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-medium-report.xml trivy-image-medium-report.json
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-critical-report.xml trivy-image-critical-report.json
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-medium-report.html trivy-image-medium-report.json
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-critical-report.html trivy-image-critical-report.json
                    '''
                }
            }
        }
        stage('Docker Push'){
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: "") {
                    sh 'docker push sunilpolaki/solar-app:$GIT_COMMIT'
                }
            }
        }
        stage ('AWS EC2 Deploy'){
            steps{
                script{
                    sshagent(['ssh']) {
                        sh """
                            echo $CONTAINER_NAME
                            echo "---- Connecting to EC2 and deploying application ----"

                            ssh -o StrictHostKeyChecking=no ubuntu@65.0.69.86 << 'EOF'
                            echo $CONTAINER_NAME

                            echo "Checking for running container..."
                            if [ \$(docker ps -q -f name=${CONTAINER_NAME}) ]; then
                                echo "Container ${CONTAINER_NAME} is running. Stopping and removing..."
                                docker stop ${CONTAINER_NAME}
                                docker rm ${CONTAINER_NAME}
                            elif [ \$(docker ps -a -q -f name=${CONTAINER_NAME}) ]; then
                                echo "Container exists but not running. Removing..."
                                docker rm ${CONTAINER_NAME}
                            else
                                echo "No existing container found."
                            fi

                            echo "Pulling latest image..."
                            docker pull sunilpolaki/solar-app:$GIT_COMMIT

                            echo "Starting new container..."
                            docker run -d --name solar-app \
                            -e MONGO_URI=${MONGO_URI} \
                            -e MONGO_USERNAME=${MONGO_USERNAME} \
                            -e MONGO_PASSWORD=${MONGO_PASSWORD} \
                            -p 3000:3000 sunilpolaki/solar-app:$GIT_COMMIT

                            echo "Deployment completed successfully!"
                            docker ps | grep ${CONTAINER_NAME}

                            EOF
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'trivy-image-critical-report.html', reportName: 'Trivy Image Critical Report', reportTitles: '', useWrapperFileDirectly: true])

            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'trivy-image-medium-report.html', reportName: 'Trivy Image Medium Report', reportTitles: '', useWrapperFileDirectly: true])
        }
    }
}
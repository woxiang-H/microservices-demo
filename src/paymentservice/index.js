/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('@google-cloud/profiler').start({
  serviceContext: {
    service: 'paymentservice',
    version: '1.0.0'
  }
});
require('@google-cloud/trace-agent').start();
require('@google-cloud/debug-agent').start({
  serviceContext: {
    service: 'paymentservice',
    version: 'VERSION'
  }
});

if(process.env.DISABLE_JAEGER) {
  console.log("JAEGER disabled.")
}
else {
  console.log("JAEGER enabled.")
  const opentelemetry = require('@opentelemetry/api');
  const { NodeTracerProvider } = require('@opentelemetry/node');
  const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
  const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

  const provider = new NodeTracerProvider();

  const jaegerOptions = {
    serviceName: 'paymentservice',
    tags: [],
    endpoint: process.env.JAEGER_SERVICE_ADDR,
    maxPacketSize: 65000
  };

  const exporter = new JaegerExporter(jaegerOptions);
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
}

if(process.env.DISABLE_ZIPKIN) {
  console.log("ZIPKIN disabled.")
}
else {
  console.log("ZIPKIN enabled.")
  const { ZipkinTraceExporter } = require('@opencensus/exporter-zipkin');
  const tracing = require('@opencensus/nodejs');

  const zipkinOptions = {
    url: process.env.ZIPKIN_SERVICE_ADDR,
    serviceName: 'paymentservice',
  };

  const exporter = new ZipkinTraceExporter(zipkinOptions);
  tracing.registerExporter(exporter).start();
}

if(process.env.DISABLE_PROMETHEUS) {
  console.log("PROMETHEUS disabled.")
}
else {
  console.log("PROMETHEUS enabled.")
  const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
  const { MeterProvider }  = require('@opentelemetry/metrics');

  const options = {port: 9464, startServer: true};
  const exporter = new PrometheusExporter(options);

  const meter = new MeterProvider({
    exporter,
    interval: 1000,
  }).getMeter('example-prometheus');

  const counter = meter.createCounter('metric_name', {
    description: 'Example of a counter'
  });
  counter.add(10, { pid: process.pid });

  const boundCounter = counter.bind({ pid: process.pid });
  boundCounter.add(10);
}

const path = require('path');
const HipsterShopServer = require('./server');

const PORT = process.env['PORT'];
const PROTO_PATH = path.join(__dirname, '/proto/');

const server = new HipsterShopServer(PROTO_PATH, PORT);

server.listen();

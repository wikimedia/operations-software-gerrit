// Copyright (C) 2023 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.httpd.raw;

import static com.google.common.truth.Truth.assertThat;
import static com.google.gerrit.httpd.raw.StaticModule.PolyGerritFilter.isPolyGerritIndex;

import org.junit.Test;

public class StaticModuleTest {

  @Test
  public void doNotMatchPolyGerritIndex() {
    assertThat(isPolyGerritIndex("/123456")).isFalse();
    assertThat(isPolyGerritIndex("/123456/")).isFalse();
    assertThat(isPolyGerritIndex("/123456/1")).isFalse();
    assertThat(isPolyGerritIndex("/123456/1/")).isFalse();
    assertThat(isPolyGerritIndex("/c/123456/comment/9ab75172_67d798e1")).isFalse();
    assertThat(isPolyGerritIndex("/123456/comment/9ab75172_67d798e1")).isFalse();
    assertThat(isPolyGerritIndex("/123456/comment/9ab75172_67d798e1/")).isFalse();
    assertThat(isPolyGerritIndex("/123456/1..2")).isFalse();
    assertThat(isPolyGerritIndex("/c/123456/1..2")).isFalse();
    assertThat(isPolyGerritIndex("/c/2/1/COMMIT_MSG")).isFalse();
    assertThat(isPolyGerritIndex("/c/2/1/path/to/source/file/MyClass.java")).isFalse();
  }

  @Test
  public void matchPolyGerritIndex() {
    assertThat(isPolyGerritIndex("/c/test/+/123456/anyString")).isTrue();
    assertThat(isPolyGerritIndex("/c/test/+/123456/comment/9ab75172_67d798e1")).isTrue();
    assertThat(isPolyGerritIndex("/c/321/+/123456/anyString")).isTrue();
    assertThat(isPolyGerritIndex("/c/321/+/123456/comment/9ab75172_67d798e1")).isTrue();
    assertThat(isPolyGerritIndex("/c/321/anyString")).isTrue();
  }
}

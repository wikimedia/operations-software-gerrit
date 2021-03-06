// Copyright (C) 2018 The Android Open Source Project
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

package com.google.gerrit.acceptance;

import static com.google.common.truth.Truth.assertThat;

import com.google.gerrit.extensions.registration.DynamicSet;
import com.google.gerrit.extensions.registration.RegistrationHandle;
import com.google.gerrit.reviewdb.client.AccountGroup;
import com.google.gerrit.server.account.GroupBackend;
import com.google.gerrit.server.account.UniversalGroupBackend;
import com.google.gerrit.server.group.testing.TestGroupBackend;
import com.google.inject.Inject;
import org.junit.Test;

public class TestGroupBackendTest extends AbstractDaemonTest {
  @Inject private DynamicSet<GroupBackend> groupBackends;
  @Inject private UniversalGroupBackend universalGroupBackend;

  private final TestGroupBackend testGroupBackend = new TestGroupBackend();
  private final AccountGroup.UUID testUUID = new AccountGroup.UUID("testbackend:test");

  @Test
  public void handlesTestGroup() throws Exception {
    assertThat(testGroupBackend.handles(testUUID)).isTrue();
  }

  @Test
  public void universalGroupBackendHandlesTestGroup() throws Exception {
    RegistrationHandle registrationHandle = groupBackends.add(testGroupBackend);
    try {
      assertThat(universalGroupBackend.handles(testUUID)).isTrue();
    } finally {
      registrationHandle.remove();
    }
  }

  @Test
  public void doesNotHandleLDAP() throws Exception {
    assertThat(testGroupBackend.handles(new AccountGroup.UUID("ldap:1234"))).isFalse();
  }

  @Test
  public void doesNotHandleNull() throws Exception {
    assertThat(testGroupBackend.handles(null)).isFalse();
  }

  @Test
  public void returnsNullWhenGroupDoesNotExist() throws Exception {
    assertThat(testGroupBackend.get(testUUID)).isNull();
  }

  @Test
  public void returnsNullForNullGroup() throws Exception {
    assertThat(testGroupBackend.get(null)).isNull();
  }

  @Test
  public void returnsKnownGroup() throws Exception {
    testGroupBackend.create(testUUID);
    assertThat(testGroupBackend.get(testUUID)).isNotNull();
  }
}
